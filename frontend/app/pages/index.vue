<script setup lang="ts">
const config = useRuntimeConfig();

const sampleText = ref("Загрузка тренировочного текста...");
const typedText = ref("");

const stats = computed(() => {
  const expected = sampleText.value;
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
    const response = await $fetch<{ text: string; level: string }>(
      `${config.public.apiBase}/lesson`
    );
    sampleText.value = response.text;
    typedText.value = "";
  } catch {
    sampleText.value =
      "Не удалось получить текст с сервера. Проверь, что backend запущен на порту 4001.";
  }
};

onMounted(fetchLesson);
</script>

<template>
  <main class="page">
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">VKR / Nuxt 4</p>
        <h1>Клавиатурный тренажер для начинающих и продвинутых пользователей</h1>
        <p class="lead">
          Стартовый набросок проекта: фронтенд на Nuxt 4, бэкенд на Node.js и
          Express. Уже можно получать текст урока, печатать и видеть базовую
          точность.
        </p>
        <div class="hero__actions">
          <button class="primary-btn" type="button" @click="fetchLesson">
            Новый текст
          </button>
        </div>
      </div>

      <div class="stats-panel">
        <div>
          <span class="stats-label">Символов</span>
          <strong>{{ stats.totalChars }}</strong>
        </div>
        <div>
          <span class="stats-label">Верно</span>
          <strong>{{ stats.correctChars }}</strong>
        </div>
        <div>
          <span class="stats-label">Точность</span>
          <strong>{{ stats.accuracy }}%</strong>
        </div>
      </div>
    </section>

    <section class="trainer">
      <div class="trainer__block">
        <p class="trainer__label">Текст для тренировки</p>
        <div class="trainer__text">
          {{ sampleText }}
        </div>
      </div>

      <div class="trainer__block">
        <label class="trainer__label" for="typing-area">Твоя попытка</label>
        <textarea
          id="typing-area"
          v-model="typedText"
          class="trainer__input"
          placeholder="Начни печатать здесь..."
          rows="8"
        />
      </div>
    </section>
  </main>
</template>
