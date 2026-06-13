import { buildPracticeText } from './typingAnalysisService.js';

export const difficultyLevels = ['beginner', 'intermediate', 'advanced'];

export const lessons = [
  { id: 'beginner-1', level: 'beginner', levelLabel: 'Начальный', text: 'дом том ком сон фон дон' },
  { id: 'beginner-2', level: 'beginner', levelLabel: 'Начальный', text: 'мир дом рука окно свет' },
  { id: 'beginner-3', level: 'beginner', levelLabel: 'Начальный', text: 'кот кит ток мак лак шаг' },
  { id: 'beginner-4', level: 'beginner', levelLabel: 'Начальный', text: 'мама мыла раму папа читал книгу' },
  { id: 'intermediate-1', level: 'intermediate', levelLabel: 'Средний', text: 'Сегодня мы тренируем ровный ритм печати и аккуратное нажатие клавиш.' },
  { id: 'intermediate-2', level: 'intermediate', levelLabel: 'Средний', text: 'Каждый точный символ помогает держать скорость без лишних исправлений.' },
  { id: 'intermediate-3', level: 'intermediate', levelLabel: 'Средний', text: 'Спокойный темп помогает пальцам запомнить правильные движения по клавиатуре.' },
  { id: 'intermediate-4', level: 'intermediate', levelLabel: 'Средний', text: 'Сначала добивайся точности, затем постепенно увеличивай скорость печати.' },
  { id: 'advanced-1', level: 'advanced', levelLabel: 'Сложный', text: 'Съешь ещё этих мягких французских булок, да выпей же чаю.' },
  { id: 'advanced-2', level: 'advanced', levelLabel: 'Сложный', text: 'Когда темп растёт, важно сохранять дыхание, внимание и одинаковую силу нажатия.' },
  { id: 'advanced-3', level: 'advanced', levelLabel: 'Сложный', text: 'Быстрая печать требует устойчивого ритма: взгляд движется вперёд, а пальцы не суетятся.' },
  { id: 'advanced-4', level: 'advanced', levelLabel: 'Сложный', text: 'Точность в 95% важнее случайного рекорда, потому что стабильность формирует настоящий навык.' }
];

export function isDifficulty(value) {
  return difficultyLevels.includes(value);
}

export function getRandomLesson(level = 'beginner') {
  const normalizedLevel = isDifficulty(level) ? level : 'beginner';
  const pool = lessons.filter((lesson) => lesson.level === normalizedLevel);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRecommendedDifficulty(results = []) {
  const recent = results.slice(0, 5);

  if (recent.length < 2) {
    return 'beginner';
  }

  const averageAccuracy = recent.reduce((sum, result) => sum + Number(result.accuracy ?? 0), 0) / recent.length;
  const averageWpm = recent.reduce((sum, result) => sum + Number(result.wpm ?? 0), 0) / recent.length;

  if (averageAccuracy >= 94 && averageWpm >= 40) {
    return 'advanced';
  }

  if (averageAccuracy >= 88 && averageWpm >= 22) {
    return 'intermediate';
  }

  return 'beginner';
}

export function buildAdaptiveLesson(results = []) {
  const difficulty = getRecommendedDifficulty(results);
  const focusChars = results
    .flatMap((result) => result.analysis?.focusChars ?? [])
    .filter(Boolean)
    .slice(0, 4);

  if (focusChars.length > 0) {
    return {
      id: `adaptive-${focusChars.join('-')}`,
      level: difficulty,
      levelLabel: 'Адаптивный',
      text: buildPracticeText(focusChars),
      source: 'adaptive'
    };
  }

  return {
    ...getRandomLesson(difficulty),
    levelLabel: 'Адаптивный',
    source: 'adaptive'
  };
}

export default {
  lessons,
  difficultyLevels,
  isDifficulty,
  getRandomLesson,
  getRecommendedDifficulty,
  buildAdaptiveLesson
};
