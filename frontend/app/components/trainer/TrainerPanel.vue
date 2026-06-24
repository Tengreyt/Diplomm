<template>
  <section :class="root()">
    <Transition name="fade" mode="out-in">
      <div v-if="!isFinished" key="trainer" :class="trainerLayout()">
        <TrainerStatsGrid :stats="props.stats" :formatted-time="formattedTime" />

        <TypingSurface
          :lesson-text="props.lessonText"
          :typed-text="props.typedText"
          @update:typed-text="(value) => emit('update:typedText', value)"
        />

        <TrainerToolbar
          :selected-difficulty="props.selectedDifficulty"
          :selected-pace="props.selectedPace"
          :lesson-level="props.lessonLevel"
          @update:difficulty="(value) => emit('update:difficulty', value)"
          @update:pace="(value) => emit('update:pace', value)"
          @refresh-lesson="emit('refreshLesson')"
        />
      </div>

      <TrainerResult
        v-else
        key="result"
        :wpm="props.stats.wpm"
        :accuracy="props.stats.accuracy"
        :errors="props.stats.errors"
        :seconds="props.stats.seconds"
        :message="props.resultMessage"
        :coach="props.coach"
        @retry="emit('refreshLesson')"
      />
    </Transition>
  </section>
</template>

<script setup lang="ts">
import type { PacePresetId } from "~/constants/trainer";
import type { DifficultyLevel, TrainerStats } from "~/types/trainer";
import type { AiCoach } from "~/types/coach";
import { tv } from "tailwind-variants";
import { computed } from "vue";
import TrainerStatsGrid from "~/components/trainer/TrainerStatsGrid.vue";
import TrainerToolbar from "~/components/trainer/TrainerToolbar.vue";
import TypingSurface from "~/components/trainer/TypingSurface.vue";

const props = defineProps<{
  lessonText: string;
  lessonLevel: string;
  selectedDifficulty: DifficultyLevel;
  selectedPace: PacePresetId;
  typedText: string;
  stats: TrainerStats;
  resultMessage: string;
  coach: AiCoach | null;
}>();

const emit = defineEmits<{
  "update:difficulty": [value: DifficultyLevel];
  "update:pace": [value: PacePresetId];
  "update:typedText": [value: string];
  refreshLesson: [];
}>();

const isFinished = computed(() => props.typedText.length >= props.lessonText.length);

const formattedTime = computed(() => {
  const minutes = Math.floor(props.stats.seconds / 60);
  const seconds = props.stats.seconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

const styles = tv({
  slots: {
    root: [
      "glass-panel flex min-h-[calc(100svh-1.25rem)] flex-col rounded-panel p-4 md:p-5",
    ],
    trainerLayout: ["flex flex-1 flex-col gap-4"],
  },
});

const { root, trainerLayout } = styles();
</script>
