/**
 * Считает новые ошибки при вводе: каждый неверный символ учитывается,
 * даже если позже его исправят через Backspace.
 */
export function countNewMistakes({
  previousText,
  nextText,
  lessonText
}: {
  previousText: string;
  nextText: string;
  lessonText: string;
}): number {
  if (nextText.length <= previousText.length) {
    return 0;
  }

  let mistakes = 0;

  for (let index = previousText.length; index < nextText.length; index += 1) {
    if (nextText[index] !== lessonText[index]) {
      mistakes += 1;
    }
  }

  return mistakes;
}

/** Ошибки в текущем тексте (без учёта исправленных). */
export function countRemainingMistakes(lessonText: string, typedText: string): number {
  let mistakes = 0;

  for (let index = 0; index < typedText.length; index += 1) {
    if (typedText[index] !== lessonText[index]) {
      mistakes += 1;
    }
  }

  return mistakes;
}
