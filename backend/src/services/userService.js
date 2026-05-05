import usersRepo from '../repo/usersRepo.js';
import crypto from 'crypto';

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

export function serializeUser(user, users) {
  const clanMembers = users.filter((entry) => entry.emoji === user.emoji).length;

  return {
    id: user.id,
    login: user.login,
    nickname: user.nickname,
    emoji: user.emoji,
    avatarUrl: user.avatarUrl || avatarPresets[0],
    clanMembers,
    createdAt: user.createdAt,
    stats: user.stats
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
  serializeUser,
  calculateClanPoints,
  avatarPresets
};
