import type { LessonResponse, TrainerStats } from "~/types/trainer";

const waitingLessonText = "РџРѕСЃР»Рµ РІС…РѕРґР° Р·РґРµСЃСЊ РїРѕСЏРІРёС‚СЃСЏ С‚РµРєСЃС‚ С‚СЂРµРЅРёСЂРѕРІРєРё.";
const offlineLessonText = "РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ С‚РµРєСЃС‚ С‚СЂРµРЅРёСЂРѕРІРєРё. РџСЂРѕРІРµСЂСЊ backend РЅР° РїРѕСЂС‚Сѓ 4001.";

export const useTrainer = () => {
  const config = useRuntimeConfig();

  const lessonText = useState("trainer-lesson-text", () => waitingLessonText);
  const lessonLevel = useState("trainer-lesson-level", () => "waiting");
  const typedText = useState("trainer-typed-text", () => "");

  const stats = computed<TrainerStats>(() => {
    const expected = lessonText.value;
    const actual = typedText.value;
    let correctChars = 0;

    for (let index = 0; index < actual.length; index += 1) {
      if (actual[index] === expected[index]) {
        correctChars += 1;
      }
    }

    const accuracy = actual.length
      ? Math.round((correctChars / actual.length) * 100)
      : 100;

    return {
      correctChars,
      accuracy,
      totalChars: expected.length
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
    } catch {
      lessonText.value = offlineLessonText;
      lessonLevel.value = "offline";
    }
  };

  const resetTrainer = () => {
    lessonText.value = waitingLessonText;
    lessonLevel.value = "waiting";
    typedText.value = "";
  };

  return {
    lessonText,
    lessonLevel,
    typedText,
    stats,
    fetchLesson,
    resetTrainer
  };
};

