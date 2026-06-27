<template>
  <div :class="root()">
    <div :class="row()">
      <button
        type="button"
        :class="iconButton()"
        aria-label="Новый текст"
        title="Новый текст"
        @click="emit('refreshLesson')"
      >
        <RotateCcw :class="icon()" aria-hidden="true" />
      </button>

      <button
        type="button"
        :class="iconButton({ active: isKeyboardSoundEnabled })"
        :aria-label="soundButtonLabel"
        :aria-pressed="isKeyboardSoundEnabled"
        :title="soundButtonLabel"
        @click="toggleKeyboardSound"
      >
        <Volume2 v-if="isKeyboardSoundEnabled" :class="icon()" aria-hidden="true" />
        <VolumeX v-else :class="icon()" aria-hidden="true" />
      </button>

      <div :class="divider()" aria-hidden="true" />

      <div :class="group()" role="group" aria-label="Сложность">
        <button
          v-for="option in difficultyOptions"
          :key="option.value"
          type="button"
          :class="chip({ active: selectedDifficulty === option.value })"
          :title="option.description"
          @click="emit('update:difficulty', option.value)"
        >
          {{ option.shortLabel }}
        </button>
      </div>

      <span :class="levelBadge()">{{ lessonLevel }}</span>
    </div>

    <div
      v-if="selectedDifficulty !== 'adaptive'"
      :class="row()"
      role="group"
      aria-label="Длина урока"
    >
      <span :class="groupLabel()">длина</span>

      <button
        v-for="preset in pacePresets"
        :key="preset.id"
        type="button"
        :class="chip({ active: selectedPace === preset.id })"
        :title="preset.hint"
        @click="emit('update:pace', preset.id)"
      >
        {{ preset.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RotateCcw, Volume2, VolumeX } from "@lucide/vue";
import { tv } from "tailwind-variants";
import { computed } from "vue";
import { difficultyOptions, pacePresets, type PacePresetId } from "~/constants/trainer";
import type { DifficultyLevel } from "~/types/trainer";

defineProps<{
  selectedDifficulty: DifficultyLevel;
  selectedPace: PacePresetId;
  lessonLevel: string;
}>();

const emit = defineEmits<{
  "update:difficulty": [value: DifficultyLevel];
  "update:pace": [value: PacePresetId];
  refreshLesson: [];
}>();

const { isKeyboardSoundEnabled, toggleKeyboardSound } = useKeyboardSound();
const soundButtonLabel = computed(() => isKeyboardSoundEnabled.value
  ? "Выключить звуки клавиатуры"
  : "Включить звуки клавиатуры");

const styles = tv({
  slots: {
    root: ["flex flex-col gap-2 border-t border-slate-900/8 pt-4"],
    row: ["flex flex-wrap items-center gap-2"],
    iconButton: [
      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-900/10 bg-white/80 text-muted transition",
      "hover:border-clan-teal/50 hover:bg-clan-teal/10 hover:text-clan-teal",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal",
    ],
    icon: ["h-4 w-4"],
    divider: ["hidden h-6 w-px shrink-0 bg-slate-900/10 sm:block"],
    group: ["flex flex-wrap items-center gap-1.5"],
    groupLabel: ["mr-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted"],
    chip: [
      "rounded-xl px-3 py-1.5 text-sm font-semibold text-muted transition",
      "hover:bg-white/80 hover:text-ink",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal",
    ],
    levelBadge: [
      "ml-auto hidden rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-muted sm:inline-flex",
    ],
  },
  variants: {
    active: {
      true: {
        iconButton: "border-clan-teal/40 bg-clan-teal/12 text-clan-teal",
        chip: "bg-clan-teal/12 text-clan-teal",
      },
      false: {},
    },
  },
});

const { root, row, iconButton, icon, divider, group, groupLabel, chip, levelBadge } = styles();
</script>
