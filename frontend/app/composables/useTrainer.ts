import { authStorageKey } from "~/constants/auth";
import type {
  DifficultyLevel,
  LessonResponse,
  SaveResultResponse,
  TrainerStats
} from "~/types/trainer";
import type { AiCoach } from "~/types/coach";
import type { UserProfile } from "~/types/auth";

const waitingLessonText = "После входа здесь появится текст тренировки.";
const offlineLessonText =
  "Не удалось получить текст тренировки. Проверь backend на порту 4001.";

let trainerTimerId: ReturnType<typeof setInterval> | null = null;

export const useTrainer = () => {
  const config = useRuntimeConfig();

  const lessonText = useState("trainer-lesson-text", () => waitingLessonText);
  const lessonLevel = useState("trainer-lesson-level", () => "waiting");
  const selectedDifficulty = useState<DifficultyLevel>("trainer-difficulty", () => "beginner");
  const typedText = useState("trainer-typed-text", () => "");
  const startedAt = useState<number | null>("trainer-started-at", () => null);
  const elapsedSeconds = useState("trainer-elapsed-seconds", () => 0);
  const isResultSaved = useState("trainer-result-saved", () => false);
  const resultMessage = useState("trainer-result-message", () => "");
  const aiCoach = useState<AiCoach | null>("trainer-ai-coach", () => null);
  const profileCoach = useState<AiCoach | null>("profile-ai-coach", () => null);
  const currentUser = useState<UserProfile | null>("auth-user", () => null);

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

    if (import.meta.client && !trainerTimerId) {
      trainerTimerId = setInterval(updateElapsedSeconds, 1000);
    }
  };

  const stopTimer = () => {
    updateElapsedSeconds();

    if (trainerTimerId) {
      clearInterval(trainerTimerId);
      trainerTimerId = null;
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

  const resetAttemptState = () => {
    typedText.value = "";
    startedAt.value = null;
    elapsedSeconds.value = 0;
    isResultSaved.value = false;
    resultMessage.value = "";
    stopTimer();
  };

  const fetchLesson = async () => {
    if (aiCoach.value?.task.targetText) {
      lessonText.value = aiCoach.value.task.targetText;
      lessonLevel.value = "AI-задание";
      resetAttemptState();
      return;
    }

    try {
      const response = await $fetch<LessonResponse>(
        `${config.public.apiBase}/lesson`,
        {
          query: {
            level: selectedDifficulty.value,
          },
        }
      );

      lessonText.value = response.text;
      lessonLevel.value = response.levelLabel;
      resetAttemptState();
    } catch {
      lessonText.value = offlineLessonText;
      lessonLevel.value = "offline";
      resetAttemptState();
    }
  };

  const startCoachLesson = (coach: AiCoach) => {
    aiCoach.value = coach;
    lessonText.value = coach.task.targetText;
    lessonLevel.value = "AI-задание";
    resetAttemptState();
  };

  const selectDifficulty = async (difficulty: DifficultyLevel) => {
    selectedDifficulty.value = difficulty;
    aiCoach.value = null;
    await fetchLesson();
  };

  const saveResult = async () => {
    if (!import.meta.client) {
      return;
    }

    const token = localStorage.getItem(authStorageKey);

    if (!token) {
      return;
    }

    const response = await $fetch<SaveResultResponse>(`${config.public.apiBase}/results`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        wpm: stats.value.wpm,
        accuracy: stats.value.accuracy,
        errors: stats.value.errors,
        seconds: stats.value.seconds,
        lessonText: lessonText.value,
        typedText: typedText.value,
        difficulty: selectedDifficulty.value,
      },
    });

    currentUser.value = response.user;
    aiCoach.value = response.coach ?? null;
    profileCoach.value = response.coach ?? profileCoach.value;
    resultMessage.value = response.tasks.earnedPoints > 0
      ? `Получено очков: ${response.tasks.earnedPoints}`
      : "Результат сохранен.";
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
        resultMessage.value = "Результат посчитан, но сохранить его не удалось.";
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
    resultMessage.value = "";
    aiCoach.value = null;
    stopTimer();
  };

  if (import.meta.client) {
    onUnmounted(stopTimer);
  }

  return {
    lessonText,
    lessonLevel,
    selectedDifficulty,
    typedText,
    stats,
    aiCoach,
    startCoachLesson,
    fetchLesson,
    selectDifficulty,
    saveResult,
    resultMessage,
    updateTypedText,
    resetTrainer,
  };
};
