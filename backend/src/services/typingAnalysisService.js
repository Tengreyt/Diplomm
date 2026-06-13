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
  'ошибка'
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

export function buildPracticeText(focusChars = []) {
  const normalizedFocusChars = focusChars.map((char) => String(char).toLowerCase());
  const focusedWords = fallbackPracticeWords.filter((word) => {
    return normalizedFocusChars.some((char) => word.includes(char));
  });

  const words = focusedWords.length > 0
    ? [...new Set([...focusedWords, ...fallbackPracticeWords])].slice(0, 6)
    : fallbackPracticeWords.slice(0, 6);

  return [...words, ...words.slice(0, 3)].join(' ');
}

export default {
  analyzeTypingAttempt,
  buildPracticeText
};
