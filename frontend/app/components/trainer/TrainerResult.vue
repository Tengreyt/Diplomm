<template>
  <div :class="resultRoot()">
    <h3 :class="resultTitle()">Результат</h3>

    <div :class="resultGrid()">
      <div :class="resultCard()">
        <span>Скорость</span>
        <strong>{{ wpm }} WPM</strong>
      </div>

      <div :class="resultCard()">
        <span>Точность</span>
        <strong>{{ accuracy }}%</strong>
      </div>

      <div :class="resultCard()">
        <span>Ошибки</span>
        <strong>{{ errors }}</strong>
      </div>
    </div>

    <button :class="retryButton()" @click="$emit('retry')">
      Попробовать снова
    </button>
  </div>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";

defineProps<{
  wpm: number;
  accuracy: number;
  errors: number;
}>();

defineEmits<{
  retry: [];
}>();

const styles = tv({
  slots: {
    resultRoot: [
      "mt-6 mb-4 rounded-2xl border border-slate-900/10 bg-white p-6",
    ],
    resultTitle: ["text-xl font-semibold"],
    resultGrid: ["mt-4 grid grid-cols-3 gap-3"],
    resultCard: [
      "rounded-xl bg-slate-100 p-4 text-center",
    ],
    retryButton: [
      "mt-5 w-full rounded-xl bg-slate-900 py-3 text-white",
    ],
  },
});

const { resultRoot, resultTitle, resultGrid, resultCard, retryButton } = styles();
</script>