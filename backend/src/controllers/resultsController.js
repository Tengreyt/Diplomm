import userService from '../services/userService.js';

export function registerResultController({ app, getSession }) {
  app.post('/api/results', (request, response) => {
    const session = getSession(request);

    if (!session) {
      return response.status(401).json({ message: 'Сессия не найдена.' });
    }

    const users = userService.readUsers();
    const user = users.find((entry) => entry.id === session.userId);

    if (!user) {
      return response.status(401).json({ message: 'Пользователь не найден.' });
    }

    const { wpm = 0, accuracy = 0, errors = 0, seconds = 0 } = request.body ?? {};

    const cleanWpm = Math.max(0, Math.round(Number(wpm) || 0));
    const cleanAccuracy = Math.max(0, Math.min(100, Math.round(Number(accuracy) || 0)));
    const cleanErrors = Math.max(0, Math.round(Number(errors) || 0));
    const cleanSeconds = Math.max(0, Math.round(Number(seconds) || 0));

    user.stats = {
      testsCompleted: Number(user.stats?.testsCompleted ?? 0) + 1,
      bestAccuracy: Math.max(Number(user.stats?.bestAccuracy ?? 0), cleanAccuracy),
      bestWpm: Math.max(Number(user.stats?.bestWpm ?? 0), cleanWpm)
    };

    user.lastResult = {
      wpm: cleanWpm,
      accuracy: cleanAccuracy,
      errors: cleanErrors,
      seconds: cleanSeconds,
      createdAt: new Date().toISOString()
    };

    userService.writeUsers(users);

    response.json({ user: userService.serializeUser(user, users), result: user.lastResult });
  });
}

export default { registerResultController };
