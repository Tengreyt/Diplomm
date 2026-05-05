import { authStorageKey } from "~/constants/auth";
import type { LessonResponse, TrainerStats } from "~/types/trainer";

const waitingLessonText = "После входа здесь появится текст тренировки.";
const offlineLessonText =
  "Не удалось получить текст тренировки. Проверь backend на порту 4001.";

export const useTrainer = () => {
  const config = useRuntimeConfig();

  const lessonText = useState("trainer-lesson-text", () => waitingLessonText);
  const lessonLevel = useState("trainer-lesson-level", () => "waiting");
  const typedText = useState("trainer-typed-text", () => "");
  const startedAt = useState<number | null>("trainer-started-at", () => null);
  const elapsedSeconds = useState("trainer-elapsed-seconds", () => 0);
  const isResultSaved = useState("trainer-result-saved", () => false);

  let timerId: ReturnType<typeof setInterval> | null = null;

  const updateElapsedSeconds = () => {
    if (!startedAt.value) {
      elapsedSeconds.value = 0;
      return;
    }

    elapsedSeconds.value = Math.max(
      1,
      Math.floor((Date.now() - startedAt.value) / 1000)
    );
  };

  const startTimer = () => {
    if (startedAt.value) {
      return;
    }

    startedAt.value = Date.now();
    elapsedSeconds.value = 1;

    if (import.meta.client) {
      timerId = setInterval(updateElapsedSeconds, 1000);
    }
  };

  const stopTimer = () => {
    updateElapsedSeconds();

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const stats = computed<TrainerStats>(() => {
    const expected = lessonText.value;
    const actual = typedText.value;

    let correctChars = 0;
    let errors = 0;

    for (let index = 0; index < actual.length; index += 1) {
      if (actual[index] === expected[index]) {
        correctChars += 1;
      } else {
        errors += 1;
      }
    }

    const accuracy = actual.length
      ? Math.round((correctChars / actual.length) * 100)
      : 100;

    const seconds = elapsedSeconds.value;
    const minutes = seconds > 0 ? seconds / 60 : 0;
    const wpm = minutes > 0 ? Math.round(correctChars / 5 / minutes) : 0;

    return {
      correctChars,
      accuracy,
      totalChars: expected.length,
      errors,
      wpm,
      seconds,
    };
  });

  const fetchLesson = async () => {
    try {
      const response = await $fetch<LessonResponse>(
        `${config.public.apiBase}/lesson`
      );

      lessonText.value = response.text;
      lessonLevel.value = response.level;
      typedText.value = "";
      startedAt.value = null;
      elapsedSeconds.value = 0;
      isResultSaved.value = false;
      stopTimer();
    } catch {
      lessonText.value = offlineLessonText;
      lessonLevel.value = "offline";
      typedText.value = "";
      startedAt.value = null;
      elapsedSeconds.value = 0;
      isResultSaved.value = false;
      stopTimer();
    }
  };

  const saveResult = async () => {
    if (!import.meta.client) {
      return;
    }

    const token = localStorage.getItem(authStorageKey);

    if (!token) {
      return;
    }

    await $fetch(`${config.public.apiBase}/results`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        wpm: stats.value.wpm,
        accuracy: stats.value.accuracy,
        errors: stats.value.errors,
        seconds: stats.value.seconds,
      },
    });
  };

  const updateTypedText = async (value: string) => {
    if (value.length > 0) {
      startTimer();
    }

    typedText.value = value;

    const isFinished = value.length >= lessonText.value.length;

    if (isFinished && !isResultSaved.value) {
      isResultSaved.value = true;
      stopTimer();

      try {
        await saveResult();
      } catch {
        // The result screen still works locally if saving fails.
      }
    }
  };

  const resetTrainer = () => {
    lessonText.value = waitingLessonText;
    lessonLevel.value = "waiting";
    typedText.value = "";
    startedAt.value = null;
    elapsedSeconds.value = 0;
    isResultSaved.value = false;
    stopTimer();
  };

  if (import.meta.client) {
    onUnmounted(stopTimer);
  }

  return {
    lessonText,
    lessonLevel,
    typedText,
    stats,
    fetchLesson,
    saveResult,
    updateTypedText,
    resetTrainer,
  };
};
