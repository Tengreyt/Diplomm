import trainingRepo from '../repo/trainingRepo.js';
import userService from '../services/userService.js';
import { buildProgressSummary } from '../services/progressService.js';

function encodeCursor(result) {
  if (!result) return null;
  return Buffer.from(JSON.stringify({ createdAt: result.createdAt, id: result.id })).toString('base64url');
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const cursor = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'));
    if (!cursor.id || !cursor.createdAt || Number.isNaN(Date.parse(cursor.createdAt))) return null;
    return { id: String(cursor.id), createdAt: new Date(cursor.createdAt).toISOString() };
  } catch {
    return null;
  }
}

export function registerProgressRoutes({ app, getSession }) {
  app.get('/api/progress', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (!session) return response.status(401).json({ message: 'Сессия не найдена.' });

      const [user, results] = await Promise.all([
        userService.findUserById(session.userId),
        trainingRepo.listUserResults(session.userId, 365)
      ]);

      if (!user) {
        return response.status(401).json({ message: 'Пользователь не найден.' });
      }

      response.json({
        summary: buildProgressSummary({
          results,
          stats: user.stats,
          points: user.stats?.points
        }),
        history: results.slice(0, 10).map(({ analysis: _analysis, ...result }) => result)
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/progress/history', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (!session) return response.status(401).json({ message: 'Сессия не найдена.' });

      const rawCursor = String(request.query.cursor ?? '').trim();
      const cursor = decodeCursor(rawCursor);
      if (rawCursor && !cursor) {
        return response.status(400).json({ message: 'Некорректный курсор истории.' });
      }

      const page = await trainingRepo.listUserResultsPage(session.userId, {
        limit: request.query.limit,
        cursor
      });
      const lastItem = page.items.at(-1);

      response.json({
        items: page.items,
        nextCursor: page.hasMore ? encodeCursor(lastItem) : null
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/progress/history/:resultId', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (!session) return response.status(401).json({ message: 'Сессия не найдена.' });

      const result = await trainingRepo.findUserResultDetails(
        session.userId,
        String(request.params.resultId)
      );
      if (!result) return response.status(404).json({ message: 'Тренировка не найдена.' });

      response.json({ result });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/progress/keyboard-heatmap/reset', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (!session) return response.status(401).json({ message: 'Сессия не найдена.' });

      const resetAt = await userService.resetKeyboardHeatmap(session.userId);
      if (!resetAt) return response.status(404).json({ message: 'Пользователь не найден.' });

      response.json({ keyboardHeatmap: {}, resetAt });
    } catch (error) {
      next(error);
    }
  });
}

export default { registerProgressRoutes };
