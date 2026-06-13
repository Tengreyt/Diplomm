import trainingRepo from '../repo/trainingRepo.js';
import aiCoachService from '../services/aiCoachService.js';
import { calculateResultMetrics } from '../services/resultMetricsService.js';
import { analyzeTypingAttempt } from '../services/typingAnalysisService.js';
import userService from '../services/userService.js';

function requestError(status, message) {
  return Object.assign(new Error(message), { status });
}

export function registerResultController({ app, getSession }) {
  app.post('/api/results', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (!session) {
        return response.status(401).json({ message: 'Сессия не найдена.' });
      }

      const attemptId = String(request.body?.attemptId ?? '').trim();
      const typedText = String(request.body?.typedText ?? '');

      if (!attemptId) {
        return response.status(400).json({ message: 'Не указан идентификатор попытки.' });
      }

      let savedResult = null;
      let taskSummary = null;
      let lessonText = '';

      const savedUser = await userService.updateUserProgressInTransaction(
        session.userId,
        async (user, client) => {
          const attempt = await trainingRepo.findAttemptForUpdate(client, {
            attemptId,
            userId: session.userId
          });

          if (!attempt) throw requestError(404, 'Попытка не найдена.');
          if (attempt.completedAt) throw requestError(409, 'Эта попытка уже сохранена.');
          if (!attempt.startedAt) throw requestError(409, 'Попытка еще не была запущена.');

          const expectedLength = Array.from(attempt.lessonText).length;
          if (Array.from(typedText).length !== expectedLength) {
            throw requestError(400, 'Для сохранения нужно завершить весь текст.');
          }

          const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
          const metrics = calculateResultMetrics({
            lessonText: attempt.lessonText,
            typedText,
            seconds: Math.ceil(elapsedMs / 1000)
          });
          const analysis = analyzeTypingAttempt({
            lessonText: attempt.lessonText,
            typedText,
            result: metrics
          });

          savedResult = await trainingRepo.createResultWithClient(client, {
            ...metrics,
            attemptId: attempt.id,
            userId: session.userId,
            lessonId: attempt.lessonId,
            difficulty: attempt.difficulty,
            source: attempt.source,
            analysis
          });
          await trainingRepo.finishAttemptWithClient(client, attempt.id);

          user.lastResult = {
            wpm: metrics.wpm,
            accuracy: metrics.accuracy,
            errors: metrics.errors,
            seconds: metrics.seconds,
            createdAt: savedResult.createdAt
          };
          taskSummary = userService.applyTaskProgress(user, user.lastResult, new Date(savedResult.createdAt));
          user.stats = {
            testsCompleted: Number(user.stats?.testsCompleted ?? 0) + 1,
            bestAccuracy: Math.max(Number(user.stats?.bestAccuracy ?? 0), metrics.accuracy),
            bestWpm: Math.max(Number(user.stats?.bestWpm ?? 0), metrics.wpm),
            points: Number(user.stats?.points ?? 0)
          };
          lessonText = attempt.lessonText;
        }
      );

      if (!savedUser) {
        return response.status(401).json({ message: 'Пользователь не найден.' });
      }

      response.json({
        user: await userService.serializeUser(savedUser),
        result: savedResult,
        tasks: taskSummary,
        coach: await aiCoachService.buildCoach({
          user: savedUser,
          result: savedResult,
          lessonText,
          typedText
        })
      });
    } catch (error) {
      if (error.status) {
        return response.status(error.status).json({ message: error.message });
      }
      next(error);
    }
  });
}

export default { registerResultController };
