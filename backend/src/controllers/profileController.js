import sessionsRepo from '../repo/sessionsRepo.js';
import userService from '../services/userService.js';

function isValidAvatarUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function registerProfileRoutes({ app, getSession }) {
  app.patch('/api/me', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (!session) return response.status(401).json({ message: 'Сессия не найдена.' });

      const user = await userService.findUserById(session.userId);
      if (!user) return response.status(401).json({ message: 'Пользователь не найден.' });

      const nickname = String(request.body?.nickname ?? '').trim();
      const avatarUrl = String(request.body?.avatarUrl ?? '').trim();
      const currentPassword = String(request.body?.currentPassword ?? '');
      const newPassword = String(request.body?.newPassword ?? '');

      if (nickname.length < 2 || nickname.length > 40) {
        return response.status(400).json({ message: 'Никнейм должен содержать от 2 до 40 символов.' });
      }

      if (!isValidAvatarUrl(avatarUrl)) {
        return response.status(400).json({ message: 'Укажи корректную HTTP(S)-ссылку на аватар.' });
      }

      let passwordHash = null;
      if (newPassword) {
        if (newPassword.length < 8) {
          return response.status(400).json({ message: 'Новый пароль должен быть не короче 8 символов.' });
        }
        if (!(await userService.verifyPassword(currentPassword, user.passwordHash))) {
          return response.status(403).json({ message: 'Текущий пароль указан неверно.' });
        }
        passwordHash = await userService.hashPassword(newPassword);
      }

      const updatedUser = await userService.updateProfile(user.id, {
        nickname,
        avatarUrl,
        passwordHash
      });

      response.json({ user: await userService.serializeUser(updatedUser) });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/me', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (!session) return response.status(401).json({ message: 'Сессия не найдена.' });

      const user = await userService.findUserById(session.userId);
      const password = String(request.body?.password ?? '');

      if (!user || !(await userService.verifyPassword(password, user.passwordHash))) {
        return response.status(403).json({ message: 'Пароль указан неверно.' });
      }

      await userService.deleteUser(user.id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/logout', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (session) {
        await sessionsRepo.deleteSession(session.tokenHash);
      }
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });
}

export default { registerProfileRoutes };
