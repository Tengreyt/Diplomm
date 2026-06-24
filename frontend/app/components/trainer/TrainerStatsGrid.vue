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
      <div :class="speedRow()">
        <strong :class="statValue()">{{ stats.wpm }}</strong>
        <span :class="wpmUnit()">WPM</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";
import type { TrainerStats } from "~/types/trainer";

defineProps<{
  stats: TrainerStats;
  formattedTime: string;
}>();

const styles = tv({
  slots: {
    statsGrid: [
      "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5",
    ],
    statCard: [
      "rounded-2xl border border-slate-900/8 bg-white/75 px-3 py-2.5",
    ],
    statLabel: [
      "block text-[10px] font-bold uppercase tracking-[0.18em] text-muted",
    ],
    statValue: [
      "mt-1 block font-mono text-2xl font-semibold tabular-nums leading-none text-ink",
    ],
    speedRow: ["mt-1 inline-flex items-baseline gap-1.5"],
    wpmUnit: ["text-xs font-semibold text-muted"],
  },
});

const { statsGrid, statCard, statLabel, statValue, speedRow, wpmUnit } = styles();
</script>
