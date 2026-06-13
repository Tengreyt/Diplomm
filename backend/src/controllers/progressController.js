import trainingRepo from '../repo/trainingRepo.js';
import userService from '../services/userService.js';
import { buildProgressSummary } from '../services/progressService.js';

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
        history: results.slice(0, 50)
      });
    } catch (error) {
      next(error);
    }
  });
}

export default { registerProgressRoutes };
