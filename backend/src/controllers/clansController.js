import userService from '../services/userService.js';

export function registerClanRoutes(app) {
  app.get('/api/clans/:emoji', async (request, response, next) => {
    try {
      const emoji = String(request.params.emoji ?? '').trim();
      const clanMembers = await userService.listClanMembers(emoji);

      response.json({
        emoji,
        members: clanMembers.map((user) => ({
          id: user.id,
          login: user.login,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl || userService.avatarPresets?.[0],
          points: Number(user.points ?? 0),
          testsCompleted: Number(user.testsCompleted ?? 0)
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/clans', async (_request, response, next) => {
    try {
      response.json({ clans: await userService.listClanRatings() });
    } catch (error) {
      next(error);
    }
  });
}

export default { registerClanRoutes };
