import trainingRepo from '../repo/trainingRepo.js';
import {
  buildAdaptiveLesson,
  getRandomLesson,
  getRecommendedDifficulty,
  isDifficulty
} from '../services/lessonService.js';

function normalizeCoachText(value) {
  const text = String(value ?? '').trim();
  return text.length >= 5 && text.length <= 500 ? text : '';
}

export function registerAttemptRoutes({ app, getSession }) {
  app.post('/api/attempts', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (!session) return response.status(401).json({ message: 'Сессия не найдена.' });

      const requestedDifficulty = String(request.body?.difficulty ?? 'beginner');
      const coachText = normalizeCoachText(request.body?.targetText);
      const [recentResults, latestAttempt, keyboardHeatmap] = await Promise.all([
        trainingRepo.listUserResults(session.userId, 50),
        trainingRepo.findLatestAttempt(session.userId),
        trainingRepo.getUserKeyboardHeatmap(session.userId)
      ]);
      const excludedTexts = latestAttempt ? [latestAttempt.lessonText] : [];
      let lesson;

      if (coachText) {
        const difficulty = isDifficulty(requestedDifficulty)
          ? requestedDifficulty
          : getRecommendedDifficulty(recentResults);
        lesson = {
          id: `coach-${Date.now()}`,
          level: difficulty,
          levelLabel: 'AI-задание',
          text: coachText,
          source: 'coach'
        };
      } else if (requestedDifficulty === 'adaptive') {
        lesson = buildAdaptiveLesson(recentResults, { excludedTexts });
      } else {
        lesson = {
          ...getRandomLesson(requestedDifficulty, excludedTexts),
          source: 'catalog'
        };
      }

      const attempt = await trainingRepo.createAttempt({
        userId: session.userId,
        lessonId: lesson.id,
        lessonText: lesson.text,
        difficulty: lesson.level,
        source: lesson.source
      });

      response.status(201).json({
        attemptId: attempt.id,
        lesson: {
          id: lesson.id,
          level: lesson.level,
          levelLabel: lesson.levelLabel,
          text: lesson.text,
          source: lesson.source
        },
        keyboardHeatmap
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/attempts/:attemptId/start', async (request, response, next) => {
    try {
      const session = await getSession(request);
      if (!session) return response.status(401).json({ message: 'Сессия не найдена.' });

      const attempt = await trainingRepo.startAttempt({
        attemptId: String(request.params.attemptId),
        userId: session.userId
      });

      if (!attempt) {
        return response.status(404).json({ message: 'Попытка не найдена или уже завершена.' });
      }

      response.json({ startedAt: attempt.startedAt });
    } catch (error) {
      next(error);
    }
  });
}

export default { registerAttemptRoutes };
