const fallbackPracticeWords = [
  'мир',
  'дом',
  'рука',
  'окно',
  'свет',
  'ритм',
  'точность',
  'скорость',
  'внимание',
  'ошибка',
  'клавиша',
  'строка',
  'буква',
  'слово',
  'фраза',
  'темп',
  'пауза',
  'фокус',
  'навык',
  'память',
  'движение',
  'практика',
  'ровно',
  'мягко',
  'быстро',
  'спокойно',
  'печать',
  'палец',
  'экран',
  'задача',
  'урок',
  'прогресс'
];

function countMapEntries(map) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => ({ value, count }));
}

export function analyzeTypingAttempt({ lessonText = '', typedText = '', result = {} } = {}) {
  const expectedChars = Array.from(String(lessonText));
  const actualChars = Array.from(String(typedText));
  const missedChars = new Map();
  const typedInstead = new Map();
  const pairs = new Map();

  for (let index = 0; index < actualChars.length; index += 1) {
    const expected = expectedChars[index] ?? '';
    const actual = actualChars[index] ?? '';

    if (!expected || expected === actual) {
      continue;
    }

    if (expected.trim()) {
      missedChars.set(expected, (missedChars.get(expected) ?? 0) + 1);
    }

    if (actual.trim()) {
      typedInstead.set(actual, (typedInstead.get(actual) ?? 0) + 1);
    }

    const pairKey = `${expected || '∅'}→${actual || '∅'}`;
    pairs.set(pairKey, (pairs.get(pairKey) ?? 0) + 1);
  }

  const focusChars = countMapEntries(missedChars)
    .slice(0, 4)
    .map((entry) => entry.value);

  return {
    accuracy: Number(result.accuracy ?? 0),
    wpm: Number(result.wpm ?? 0),
    errors: Number(result.errors ?? 0),
    seconds: Number(result.seconds ?? 0),
    totalTyped: actualChars.length,
    focusChars,
    missedChars: countMapEntries(missedChars).slice(0, 6),
    typedInstead: countMapEntries(typedInstead).slice(0, 6),
    pairs: countMapEntries(pairs).slice(0, 6),
    hasTextSample: expectedChars.length > 0 && actualChars.length > 0
  };
}

export function buildPracticeText(focusChars = [], variant = 0) {
  const normalizedFocusChars = [...new Set(
    focusChars.map((char) => String(char).toLowerCase()).filter(Boolean)
  )];
  const focusedWords = fallbackPracticeWords.filter((word) => {
    return normalizedFocusChars.some((char) => word.includes(char));
  });
  const wordPool = [...new Set([...focusedWords, ...fallbackPracticeWords])];
  const offset = Math.abs(Number(variant) || 0) % wordPool.length;
  const rotatedWords = [...wordPool.slice(offset), ...wordPool.slice(0, offset)];
  const words = rotatedWords.slice(0, 10);

  return [...words, ...words.slice(0, 4)].join(' ');
}

export function buildKeyboardHeatmap(results = []) {
  const heatmap = {};

  for (const result of results) {
    for (const entry of result.analysis?.missedChars ?? []) {
      const key = String(entry.value ?? '').toLowerCase();
      const count = Math.max(0, Number(entry.count) || 0);
      if (!key || key.length !== 1 || count === 0) continue;
      heatmap[key] = (heatmap[key] ?? 0) + count;
    }
  }

  return heatmap;
}

export default {
  analyzeTypingAttempt,
  buildPracticeText,
  buildKeyboardHeatmap
};
