<template>
  <div :class="statsGrid()">
    <div :class="statCard()">
      <span :class="statLabel()">Время</span>
      <strong :class="statValue()">{{ formattedTime }}</strong>
    </div>

    <div :class="statCard()">
      <span :class="statLabel()">Символов</span>
      <strong :class="statValue()">{{ stats.totalChars }}</strong>
    </div>

    <div :class="statCard()">
      <span :class="statLabel()">Верно</span>
      <strong :class="statValue()">{{ stats.correctChars }}</strong>
    </div>

    <div :class="statCard()">
      <span :class="statLabel()">Точность</span>
      <strong :class="statValue()">{{ stats.accuracy }}%</strong>
    </div>

    <div :class="statCard()">
      <span :class="statLabel()">Скорость</span>
      <div class="mt-2 inline-flex items-center gap-2">
        <strong :class="statValueWpm()">{{ stats.wpm }}</strong>
        <span :class="wpmUnit()">WPM</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tv } from 'tailwind-variants';
import type { TrainerStats } from '~/types/trainer';

const props = defineProps<{
  stats: TrainerStats;
  formattedTime: string;
}>();

const styles = tv({
  slots: {
    statsGrid: ['mt-6 grid gap-3 md:grid-cols-5'],
    statCard: ['glass-card rounded-2xl p-4'],
    statLabel: ['block text-xs font-semibold uppercase tracking-[0.18em] text-muted'],
    statValue: ['mt-2 block text-3xl'],
    statValueWpm: ['text-3xl font-mono tabular-nums leading-none'],
    wpmUnit: ['text-base text-muted leading-none'],
  },
});

const { statsGrid, statCard, statLabel, statValue, statValueWpm, wpmUnit } = styles();
</script>
