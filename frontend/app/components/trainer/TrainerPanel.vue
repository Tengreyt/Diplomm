<template>
  <section :class="root()">
    <Transition name="fade" mode="out-in">
      <div v-if="!isFinished" key="trainer" :class="trainerLayout()">
        <TrainerStatsGrid :stats="props.stats" :formatted-time="formattedTime" />

        <TypingSurface
          :lesson-text="props.lessonText"
          :typed-text="props.typedText"
          :is-keyboard-guide-expanded="isKeyboardGuideExpanded"
          @update:typed-text="(value) => emit('update:typedText', value)"
        />

        <KeyboardGuide
          :lesson-text="props.lessonText"
          :typed-text="props.typedText"
          :heatmap="props.keyboardHeatmap"
          :is-resetting="props.isHeatmapResetting"
          :reset-error="props.heatmapResetError"
          @expanded-change="(value) => isKeyboardGuideExpanded = value"
          @reset-heatmap="emit('resetHeatmap')"
        />

        <div class="mt-auto">
          <TrainerToolbar
            :selected-difficulty="props.selectedDifficulty"
            :selected-pace="props.selectedPace"
            :lesson-level="props.lessonLevel"
            @update:difficulty="(value) => emit('update:difficulty', value)"
            @update:pace="(value) => emit('update:pace', value)"
            @refresh-lesson="emit('refreshLesson')"
          />
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
import { computed, ref } from "vue";
import TrainerStatsGrid from "~/components/trainer/TrainerStatsGrid.vue";
import TrainerToolbar from "~/components/trainer/TrainerToolbar.vue";
import TypingSurface from "~/components/trainer/TypingSurface.vue";
import KeyboardGuide from "~/components/trainer/KeyboardGuide.vue";

const props = defineProps<{
  lessonText: string;
  lessonLevel: string;
  selectedDifficulty: DifficultyLevel;
  selectedPace: PacePresetId;
  typedText: string;
  keyboardHeatmap: Record<string, number>;
  isHeatmapResetting: boolean;
  heatmapResetError: string;
  stats: TrainerStats;
  resultMessage: string;
  coach: AiCoach | null;
}>();

const emit = defineEmits<{
  "update:difficulty": [value: DifficultyLevel];
  "update:pace": [value: PacePresetId];
  "update:typedText": [value: string];
  resetHeatmap: [];
  refreshLesson: [];
}>();

const isFinished = computed(() => props.typedText.length >= props.lessonText.length);
const isKeyboardGuideExpanded = ref(true);

const formattedTime = computed(() => {
  const minutes = Math.floor(props.stats.seconds / 60);
  const seconds = props.stats.seconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

const styles = tv({
  slots: {
    root: [
      "glass-panel flex h-[calc(100svh-1.25rem)] flex-col overflow-hidden rounded-panel p-4 md:p-5",
    ],
    trainerLayout: ["profile-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"],
  },
});

const { root, trainerLayout } = styles();
</script>
