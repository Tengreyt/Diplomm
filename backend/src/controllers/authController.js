import userService from '../services/userService.js';
import crypto from 'crypto';

export function registerAuthRoutes(app, createSession) {
  app.post('/api/auth/register', (request, response) => {
    const users = userService.readUsers();
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

    if (users.some((user) => user.login === cleanLogin)) {
      return response.status(409).json({ message: 'Пользователь с таким логином уже существует.' });
    }

    const newUser = {
      id: crypto.randomUUID(),
      login: cleanLogin,
      nickname: cleanNickname,
      emoji: cleanEmoji,
      avatarUrl: cleanAvatarUrl,
      createdAt: new Date().toISOString(),
      passwordHash: userService.createHash(password),
      stats: {
        testsCompleted: 0,
        bestAccuracy: 0,
        bestWpm: 0,
        points: 0
      },
      taskState: {},
      taskCompletions: []
    };

    users.push(newUser);
    userService.writeUsers(users);

    const token = createSession(newUser.id);

    response.status(201).json({ token, user: userService.serializeUser(newUser, users) });
  });

  app.post('/api/auth/login', (request, response) => {
    const users = userService.readUsers();
    const { login = '', password = '' } = request.body ?? {};
    const cleanLogin = String(login).trim().toLowerCase();

    const user = users.find((entry) => entry.login === cleanLogin);

    if (!user || user.passwordHash !== userService.createHash(password)) {
      return response.status(401).json({ message: 'Неверный логин или пароль.' });
    }

    const token = createSession(user.id);

    response.json({ token, user: userService.serializeUser(user, users) });
  });
}

export default {
  registerAuthRoutes
};
