import userService from '../services/userService.js';

export function registerClanRoutes(app) {
  app.get('/api/clans/:emoji', (request, response) => {
    const users = userService.readUsers();
    const emoji = String(request.params.emoji ?? '').trim();
    const clanMembers = users.filter((user) => user.emoji === emoji);

    response.json({
      emoji,
      members: clanMembers
        .map((user) => ({
          id: user.id,
          login: user.login,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl || userService.avatarPresets?.[0],
          points: Number(user.stats?.points ?? 0),
          testsCompleted: Number(user.stats?.testsCompleted ?? 0)
        }))
        .sort((left, right) => {
          if (right.points !== left.points) return right.points - left.points;
          return right.testsCompleted - left.testsCompleted;
        })
    });
  });

  app.get('/api/clans', (_request, response) => {
    const users = userService.readUsers();
    const clansMap = new Map();

    for (const user of users) {
      const emoji = String(user.emoji ?? '').trim();

      if (!emoji) continue;

      const entry = clansMap.get(emoji) ?? { emoji, members: 0, points: 0 };
      entry.members += 1;
      entry.points += Number(user.stats?.points ?? 0);
      clansMap.set(emoji, entry);
    }

    const clans = Array.from(clansMap.values()).sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      return right.members - left.members;
    });

    response.json({ clans });
  });
}

export default { registerClanRoutes };
