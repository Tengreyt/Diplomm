import userService from '../services/userService.js';

export function registerAuthRoutes(app, createSession) {
  app.post('/api/auth/register', async (request, response, next) => {
    try {
      const { login = '', password = '', nickname = '', emoji = '', avatarUrl = '' } = request.body ?? {};

      const cleanLogin = String(login).trim().toLowerCase();
      const cleanNickname = String(nickname).trim();
      const cleanEmoji = String(emoji).trim();
      const cleanAvatarUrl = String(avatarUrl).trim();

      if (!cleanLogin || !password || !cleanNickname || !cleanEmoji || !cleanAvatarUrl) {
        return response.status(400).json({ message: 'Заполни логин, пароль, ник, эмоджи клана и аватар.' });
      }

      if (cleanLogin.length < 3) {
        return response.status(400).json({ message: 'Логин должен быть не короче 3 символов.' });
      }

      if (String(password).length < 6) {
        return response.status(400).json({ message: 'Пароль должен быть не короче 6 символов.' });
      }

      const existingUser = await userService.findUserByLogin(cleanLogin);

      if (existingUser) {
        return response.status(409).json({ message: 'Пользователь с таким логином уже существует.' });
      }

      const newUser = await userService.createUser({
        login: cleanLogin,
        nickname: cleanNickname,
        emoji: cleanEmoji,
        avatarUrl: cleanAvatarUrl,
        passwordHash: await userService.hashPassword(password),
        stats: {
          testsCompleted: 0,
          bestAccuracy: 0,
          bestWpm: 0,
          points: 0
        },
        taskState: {},
        taskCompletions: []
      });

      const token = await createSession(newUser.id);

      response.status(201).json({ token, user: await userService.serializeUser(newUser) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/login', async (request, response, next) => {
    try {
      const { login = '', password = '' } = request.body ?? {};
      const cleanLogin = String(login).trim().toLowerCase();

      const user = await userService.findUserByLogin(cleanLogin);

      if (!user || !(await userService.verifyPassword(password, user.passwordHash))) {
        return response.status(401).json({ message: 'Неверный логин или пароль.' });
      }

      if (userService.shouldUpgradePasswordHash(user.passwordHash)) {
        await userService.updatePasswordHash(user.id, await userService.hashPassword(password));
      }

      const token = await createSession(user.id);

      response.json({ token, user: await userService.serializeUser(user) });
    } catch (error) {
      next(error);
    }
  });
}

export default {
  registerAuthRoutes
};
