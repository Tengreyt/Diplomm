import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import userService from './services/userService.js';
import crypto from 'crypto';

import { registerAuthRoutes } from './controllers/authController.js';
import { registerClanRoutes } from './controllers/clansController.js';
import { registerResultController } from './controllers/resultsController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
export const port = process.env.PORT || 4001;

const sessions = new Map();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

export const lessons = [
  { id: 1, level: 'beginner', text: 'дом том ком сон фон дон' },
  { id: 2, level: 'intermediate', text: 'Сегодня мы тренируем ровный ритм печати и аккуратное нажатие клавиш.' },
  { id: 3, level: 'advanced', text: 'Съешь ещё этих мягких французских булок, да выпей же чаю.' }
];

export const avatarPresets = userService.avatarPresets;

export function createSession(userId) {
  const token = Buffer.from(cryptoRandom(24)).toString('hex');
  sessions.set(token, { token, userId, createdAt: Date.now() });
  return token;
}

export function getSession(request) {
  const header = request.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return token ? sessions.get(token) : null;
}

function cryptoRandom(bytes = 24) {
  return crypto.randomBytes(bytes);
}

// register controllers
registerAuthRoutes(app, createSession);
registerClanRoutes(app);
registerResultController({ app, getSession });

// misc public endpoints used by frontend
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'keyboard-trainer-backend' }));

app.get('/api/lesson', (_req, res) => {
  const lesson = lessons[Math.floor(Math.random() * lessons.length)];
  res.json(lesson);
});

app.get('/api/me', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ message: 'Сессия не найдена.' });

  const users = userService.readUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) {
    sessions.delete(session.token);
    return res.status(401).json({ message: 'Пользователь не найден.' });
  }

  res.json({ user: userService.serializeUser(user, users) });
});
