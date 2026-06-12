import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

import sessionsRepo from './repo/sessionsRepo.js';
import userService from './services/userService.js';
import { registerAuthRoutes } from './controllers/authController.js';
import { registerClanRoutes } from './controllers/clansController.js';
import { registerResultController } from './controllers/resultsController.js';
import { registerAiCoachRoutes } from './controllers/aiCoachController.js';

export const app = express();
export const port = process.env.PORT || 4001;

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;

app.set('trust proxy', 1);
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

export const lessons = [
  { id: 1, level: 'beginner', levelLabel: 'Начальный', text: 'дом том ком сон фон дон' },
  { id: 2, level: 'beginner', levelLabel: 'Начальный', text: 'мир дом рука окно свет' },
  { id: 3, level: 'intermediate', levelLabel: 'Средний', text: 'Сегодня мы тренируем ровный ритм печати и аккуратное нажатие клавиш.' },
  { id: 4, level: 'intermediate', levelLabel: 'Средний', text: 'Каждый точный символ помогает держать скорость без лишних исправлений.' },
  { id: 5, level: 'advanced', levelLabel: 'Сложный', text: 'Съешь ещё этих мягких французских булок, да выпей же чаю.' },
  { id: 6, level: 'advanced', levelLabel: 'Сложный', text: 'Когда темп растёт, важно сохранять дыхание, внимание и одинаковую силу нажатия.' }
];

export const avatarPresets = userService.avatarPresets;

function createTokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId) {
  const token = cryptoRandom(32).toString('hex');
  await sessionsRepo.createSessionRecord({
    tokenHash: createTokenHash(token),
    userId
  });
  return token;
}

export async function getSession(request) {
  const header = request.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return null;
  }

  const session = await sessionsRepo.findSessionByTokenHash(createTokenHash(token));

  if (!session) {
    return null;
  }

  return {
    token,
    tokenHash: session.tokenHash,
    userId: session.userId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt
  };
}

function cryptoRandom(bytes = 24) {
  return crypto.randomBytes(bytes);
}

// register controllers
registerAuthRoutes(app, createSession);
registerClanRoutes(app);
registerResultController({ app, getSession });
registerAiCoachRoutes({ app, getSession });

// misc public endpoints used by frontend
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'keyboard-trainer-backend' }));

app.get('/api/lesson', (req, res) => {
  const requestedLevel = String(req.query.level ?? '').trim();
  const availableLessons = lessons.filter((lesson) => lesson.level === requestedLevel);
  const lessonPool = availableLessons.length > 0 ? availableLessons : lessons;
  const lesson = lessonPool[Math.floor(Math.random() * lessonPool.length)];
  res.json(lesson);
});

app.get('/api/me', async (req, res, next) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ message: 'Сессия не найдена.' });

    const user = await userService.findUserById(session.userId);
    if (!user) {
      await sessionsRepo.deleteSession(session.tokenHash);
      return res.status(401).json({ message: 'Пользователь не найден.' });
    }

    res.json({ user: await userService.serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
});
