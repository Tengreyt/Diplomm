import { authStorageKey } from "~/constants/auth";
import type {
  AttemptResponse,
  DifficultyLevel,
  SaveResultResponse,
  TrainerStats
} from "~/types/trainer";
import type { AiCoach } from "~/types/coach";
import type { UserProfile } from "~/types/auth";

const waitingLessonText = "После входа здесь появится текст тренировки.";
const offlineLessonText = "Не удалось получить текст тренировки. Проверь подключение к backend.";

let trainerTimerId: ReturnType<typeof setInterval> | null = null;
let attemptStartPromise: Promise<void> | null = null;

export const useTrainer = () => {
  const config = useRuntimeConfig();

  const lessonText = useState("trainer-lesson-text", () => waitingLessonText);
  const lessonLevel = useState("trainer-lesson-level", () => "waiting");
  const selectedDifficulty = useState<DifficultyLevel>("trainer-difficulty", () => "adaptive");
  const attemptId = useState("trainer-attempt-id", () => "");
  const typedText = useState("trainer-typed-text", () => "");
  const startedAt = useState<number | null>("trainer-started-at", () => null);
  const elapsedSeconds = useState("trainer-elapsed-seconds", () => 0);
  const isResultSaved = useState("trainer-result-saved", () => false);
  const savedStats = useState<TrainerStats | null>("trainer-saved-stats", () => null);
  const resultMessage = useState("trainer-result-message", () => "");
  const aiCoach = useState<AiCoach | null>("trainer-ai-coach", () => null);
  const currentUser = useState<UserProfile | null>("auth-user", () => null);
  const { clearProgress } = useProgress();
  const { setProfileCoach } = useAiCoach();
  const { invalidateClanData } = useClanData();

  const updateElapsedSeconds = () => {
    if (!startedAt.value) {
      elapsedSeconds.value = 0;
      return;
    }
    elapsedSeconds.value = Math.max(1, Math.floor((Date.now() - startedAt.value) / 1000));
  };

  const startTimer = () => {
    if (startedAt.value) return;
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

  const liveStats = computed<TrainerStats>(() => {
    const expected = lessonText.value;
    const actual = typedText.value;
    let correctChars = 0;
    let errors = 0;

    for (let index = 0; index < actual.length; index += 1) {
      if (actual[index] === expected[index]) correctChars += 1;
      else errors += 1;
    }

    const accuracy = actual.length ? Math.round((correctChars / actual.length) * 100) : 100;
    const minutes = elapsedSeconds.value > 0 ? elapsedSeconds.value / 60 : 0;

    return {
      correctChars,
      accuracy,
      totalChars: expected.length,
      errors,
      wpm: minutes > 0 ? Math.round(correctChars / 5 / minutes) : 0,
      seconds: elapsedSeconds.value
    };
  });

  const stats = computed(() => savedStats.value ?? liveStats.value);

  const resetAttemptState = () => {
    stopTimer();
    typedText.value = "";
    startedAt.value = null;
    elapsedSeconds.value = 0;
    isResultSaved.value = false;
    savedStats.value = null;
    resultMessage.value = "";
    attemptStartPromise = null;
  };

  const createAttempt = async (targetText = "") => {
    if (!import.meta.client) return;
    const token = localStorage.getItem(authStorageKey);
    if (!token) return;

    const response = await $fetch<AttemptResponse>(`${config.public.apiBase}/attempts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: {
        difficulty: selectedDifficulty.value,
        targetText: targetText || undefined
      }
    });

    attemptId.value = response.attemptId;
    lessonText.value = response.lesson.text;
    lessonLevel.value = response.lesson.levelLabel;
    resetAttemptState();
  };

  const fetchLesson = async () => {
    aiCoach.value = null;
    try {
      await createAttempt();
    } catch {
      attemptId.value = "";
      lessonText.value = offlineLessonText;
      lessonLevel.value = "offline";
      resetAttemptState();
    }
  };

  const startCoachLesson = async (coach: AiCoach) => {
    aiCoach.value = coach;
    try {
      await createAttempt(coach.task.targetText);
    } catch {
      resultMessage.value = "Не удалось запустить AI-задание.";
    }
  };

  const selectDifficulty = async (difficulty: DifficultyLevel) => {
    selectedDifficulty.value = difficulty;
    await fetchLesson();
  };

  const startServerAttempt = () => {
    if (!import.meta.client || !attemptId.value) return Promise.resolve();
    if (attemptStartPromise) return attemptStartPromise;

    const token = localStorage.getItem(authStorageKey);
    attemptStartPromise = $fetch(`${config.public.apiBase}/attempts/${attemptId.value}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => undefined)
      .catch((error) => {
        attemptStartPromise = null;
        throw error;
      });

    return attemptStartPromise;
  };

  const saveResult = async () => {
    if (!import.meta.client || !attemptId.value) return;
    const token = localStorage.getItem(authStorageKey);
    if (!token) return;

    await startServerAttempt();
    const response = await $fetch<SaveResultResponse>(`${config.public.apiBase}/results`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: {
        attemptId: attemptId.value,
        typedText: typedText.value
      }
    });

    currentUser.value = response.user;
    savedStats.value = {
      wpm: response.result.wpm,
      accuracy: response.result.accuracy,
      errors: response.result.errors,
      seconds: response.result.seconds,
      correctChars: response.result.correctChars,
      totalChars: response.result.totalChars
    };
    aiCoach.value = response.coach ?? null;
    if (response.coach) {
      setProfileCoach(response.coach);
    }
    clearProgress();
    invalidateClanData(response.user.emoji);
    resultMessage.value = response.tasks.earnedPoints > 0
      ? `Получено очков: ${response.tasks.earnedPoints}`
      : "Результат сохранен.";
  };

  const updateTypedText = async (value: string) => {
    if (value.length > 0 && !startedAt.value) {
      startTimer();
      void startServerAttempt().catch(() => undefined);
    }

    typedText.value = value;
    if (value.length >= lessonText.value.length && !isResultSaved.value) {
      isResultSaved.value = true;
      stopTimer();
      try {
        await saveResult();
      } catch (error: any) {
        resultMessage.value = error?.data?.message || "Результат посчитан, но сохранить его не удалось.";
      }
    }
  };

  const resetTrainer = () => {
    stopTimer();
    lessonText.value = waitingLessonText;
    lessonLevel.value = "waiting";
    attemptId.value = "";
    typedText.value = "";
    startedAt.value = null;
    elapsedSeconds.value = 0;
    isResultSaved.value = false;
    savedStats.value = null;
    resultMessage.value = "";
    aiCoach.value = null;
    attemptStartPromise = null;
    clearProgress();
  };

  if (import.meta.client) onUnmounted(stopTimer);

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
    resetTrainer
  };
};
