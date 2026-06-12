import aiCoachService from '../services/aiCoachService.js';
import userService from '../services/userService.js';

export function registerAiCoachRoutes({ app, getSession }) {
  app.get('/api/ai/coach', async (request, response, next) => {
    try {
      const session = await getSession(request);

      if (!session) {
        return response.status(401).json({ message: 'Сессия не найдена.' });
      }

      const user = await userService.findUserById(session.userId);

      if (!user) {
        return response.status(401).json({ message: 'Пользователь не найден.' });
      }

      const coach = await aiCoachService.buildCoach({ user });

      response.json({ coach });
    } catch (error) {
      next(error);
    }
  });
}

export default { registerAiCoachRoutes };
