<template>
  <section :class="root()">
    <Transition name="fade" mode="out-in">
      <div v-if="!isFinished" key="trainer">
        <div :class="header()">
          <div>
            <p :class="kicker()">Режим тренировки</p>
            <h2 :class="title()">Личный тренажер</h2>
          </div>
          <DifficultySelector
            :model-value="props.selectedDifficulty"
            @update:model-value="emit('update:difficulty', $event)"
          />
        </div>

        <TrainerStatsGrid :stats="props.stats" :formattedTime="formattedTime" />

        <div :class="sectionBlock()">
          <div :class="sectionHeader()">
            <span :class="sectionLabel()">Печатай текст</span>
            <span :class="progressText()">{{ typedText.length }} / {{ lessonText.length }}</span>
          </div>
          <TypingSurface
            :lessonText="props.lessonText"
            :typedText="props.typedText"
            @update:typedText="(v) => emit('update:typedText', v)"
          />
          <div :class="buttonRow()">
            <button type="button" :class="actionButton()" @click="emit('refreshLesson')">
              Новый текст
            </button>
          </div>
        </div>
      </div>
      <TrainerResult
        v-else
        key="result"
        :wpm="props.stats.wpm"
        :accuracy="props.stats.accuracy"
        :errors="props.stats.errors"
        :seconds="props.stats.seconds"
        :message="props.resultMessage"
        @retry="emit('refreshLesson')"
      />
    </Transition>
  </section>
</template>

<script setup lang="ts">
import type { DifficultyLevel, TrainerStats } from "~/types/trainer";
import { tv } from "tailwind-variants";
import { computed } from "vue";
import DifficultySelector from "~/components/trainer/DifficultySelector.vue";
import TrainerStatsGrid from "~/components/trainer/TrainerStatsGrid.vue";
import TypingSurface from "~/components/trainer/TypingSurface.vue";

const props = defineProps<{
  lessonText: string;
  lessonLevel: string;
  selectedDifficulty: DifficultyLevel;
  typedText: string;
  stats: TrainerStats;
  resultMessage: string;
}>();

const emit = defineEmits<{
  "update:difficulty": [value: DifficultyLevel];
  "update:typedText": [value: string];
  refreshLesson: [];
}>();

const isFinished = computed(() => {
  return props.typedText.length >= props.lessonText.length;
});

const formattedTime = computed(() => {
  const minutes = Math.floor(props.stats.seconds / 60);
  const seconds = props.stats.seconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

const styles = tv({
  slots: {
    root: [
      "min-h-[560px] rounded-panel border border-slate-900/10 bg-white/80 p-6 shadow-soft backdrop-blur-xl md:p-7 flex flex-col",
    ],
    header: ["flex flex-col justify-between gap-4 md:flex-row md:items-start"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    sectionBlock: ["mt-6 flex flex-col gap-3"],
    sectionHeader: ["flex items-center justify-between gap-3"],
    sectionLabel: ["block text-sm font-semibold leading-5 text-muted"],
    progressText: ["text-sm font-semibold text-muted"],
    actionButton: [
      "rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800",
    ],
    buttonRow: ["flex justify-end"],
  },
});

const {
  root,
  header,
  kicker,
  title,
  sectionBlock,
  sectionHeader,
  sectionLabel,
  progressText,
  actionButton,
  buttonRow,
} = styles();
</script>
