import usersRepo from '../repo/usersRepo.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import tasksService from './tasksService.js';

const avatarPresets = [
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Orbit',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Nova',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Pixel',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Signal'
];

export { avatarPresets };

export function createHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export async function hashPassword(password) {
  return bcrypt.hash(String(password), 12);
}

export async function verifyPassword(password, passwordHash) {
  const hash = String(passwordHash ?? '');

  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compare(String(password), hash);
  }

  return createHash(password) === hash;
}

export function shouldUpgradePasswordHash(passwordHash) {
  const hash = String(passwordHash ?? '');
  return !(hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$'));
}

export async function serializeUser(user, users) {
  const clanMembers = Array.isArray(users)
    ? users.filter((entry) => entry.emoji === user.emoji).length
    : await usersRepo.countClanMembers(user.emoji);
  const points = Number(user.stats?.points ?? 0);

  return {
    id: user.id,
    login: user.login,
    nickname: user.nickname,
    emoji: user.emoji,
    avatarUrl: user.avatarUrl || avatarPresets[0],
    clanMembers,
    createdAt: user.createdAt,
    stats: {
      testsCompleted: Number(user.stats?.testsCompleted ?? 0),
      bestAccuracy: Number(user.stats?.bestAccuracy ?? 0),
      bestWpm: Number(user.stats?.bestWpm ?? 0),
      points
    },
    tasks: tasksService.getUserTasks(user)
  };
}

export function calculateClanPoints(emoji) {
  let hash = 0;

  for (const symbol of String(emoji)) {
    hash = (hash * 31 + symbol.codePointAt(0)) % 100000;
  }

  return 100 + (hash % 900);
}

export default {
  ...usersRepo,
  createHash,
  hashPassword,
  verifyPassword,
  shouldUpgradePasswordHash,
  serializeUser,
  calculateClanPoints,
  avatarPresets,
  applyTaskProgress: tasksService.applyTaskProgress
};
