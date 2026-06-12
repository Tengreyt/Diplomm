import userService from '../services/userService.js';

export function registerResultController({ app, getSession }) {
  app.post('/api/results', async (request, response, next) => {
    try {
      const session = await getSession(request);

      if (!session) {
        return response.status(401).json({ message: 'Сессия не найдена.' });
      }

      const { wpm = 0, accuracy = 0, errors = 0, seconds = 0 } = request.body ?? {};

      const cleanWpm = Math.max(0, Math.round(Number(wpm) || 0));
      const cleanAccuracy = Math.max(0, Math.min(100, Math.round(Number(accuracy) || 0)));
      const cleanErrors = Math.max(0, Math.round(Number(errors) || 0));
      const cleanSeconds = Math.max(0, Math.round(Number(seconds) || 0));

      let lastResult = null;
      let taskSummary = null;

      const savedUser = await userService.updateUserProgressInTransaction(session.userId, async (user) => {
        user.lastResult = {
          wpm: cleanWpm,
          accuracy: cleanAccuracy,
          errors: cleanErrors,
          seconds: cleanSeconds,
          createdAt: new Date().toISOString()
        };

        lastResult = user.lastResult;
        taskSummary = userService.applyTaskProgress(user, user.lastResult, new Date(user.lastResult.createdAt));

        user.stats = {
          testsCompleted: Number(user.stats?.testsCompleted ?? 0) + 1,
          bestAccuracy: Math.max(Number(user.stats?.bestAccuracy ?? 0), cleanAccuracy),
          bestWpm: Math.max(Number(user.stats?.bestWpm ?? 0), cleanWpm),
          points: Number(user.stats?.points ?? 0)
        };
      });

      if (!savedUser) {
        return response.status(401).json({ message: 'Пользователь не найден.' });
      }

      response.json({
        user: await userService.serializeUser(savedUser),
        result: savedUser.lastResult ?? lastResult,
        tasks: taskSummary
      });
    } catch (error) {
      next(error);
    }
  });
}

export default { registerResultController };
