<template>
  <div ref="rootElement" :class="root()">
    <button
      type="button"
      :class="trigger()"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span>{{ selectedOption.label }}</span>
      <svg
        :class="chevron({ open: isOpen })"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <Transition name="fade">
      <div v-if="isOpen" :class="menu()" role="listbox">
        <button
          v-for="option in difficultyOptions"
          :key="option.value"
          type="button"
          :class="optionButton({ active: modelValue === option.value })"
          role="option"
          :aria-selected="modelValue === option.value"
          @click="selectOption(option.value)"
          @mouseenter="hoveredDifficulty = option.value"
          @focus="hoveredDifficulty = option.value"
        >
          <span :class="optionLabel()">{{ option.label }}</span>
        </button>

        <p :class="description()">
          {{ hoveredOption.description }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";
import { difficultyOptions } from "~/constants/trainer";
import type { DifficultyLevel } from "~/types/trainer";

const props = defineProps<{
  modelValue: DifficultyLevel;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: DifficultyLevel];
}>();

const rootElement = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const hoveredDifficulty = ref<DifficultyLevel | null>(null);

const selectedOption = computed(() => {
  return difficultyOptions.find((option) => option.value === props.modelValue) ?? difficultyOptions[0]!;
});

const hoveredOption = computed(() => {
  return difficultyOptions.find((option) => option.value === (hoveredDifficulty.value ?? props.modelValue)) ?? selectedOption.value;
});

const toggle = () => {
  isOpen.value = !isOpen.value;
  hoveredDifficulty.value = props.modelValue;
};

const selectOption = (difficulty: DifficultyLevel) => {
  emit("update:modelValue", difficulty);
  isOpen.value = false;
};

const handleWindowClick = (event: MouseEvent) => {
  if (!rootElement.value?.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("click", handleWindowClick);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", handleWindowClick);
});

const styles = tv({
  slots: {
    root: ["relative inline-flex"],
    trigger: [
      "inline-flex h-10 min-w-[156px] items-center justify-between gap-3 rounded-2xl border border-accent-deep bg-accent-deep/10 px-4 text-sm font-semibold text-accent-deep transition",
      "hover:bg-accent-deep/15",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep",
    ],
    chevron: ["h-4 w-4 shrink-0 transition-transform"],
    menu: [
      "absolute right-0 top-[calc(100%+0.5rem)] z-20 w-60 rounded-2xl border border-slate-900/10 bg-white p-2 text-left shadow-soft",
    ],
    optionButton: [
      "w-full rounded-xl px-3 py-2 text-left transition",
      "hover:border-clan-teal/60 hover:bg-clan-teal/10",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal",
    ],
    optionLabel: ["block text-sm font-bold text-ink"],
    description: ["mt-2 rounded-xl bg-slate-100 px-3 py-2 text-xs leading-5 text-muted"],
  },
  variants: {
    active: {
      true: {
        optionButton: "bg-clan-teal/10 text-clan-teal",
      },
      false: {},
    },
    open: {
      true: {
        chevron: "rotate-180",
      },
      false: {},
    },
  },
});

const { root, trigger, chevron, menu, optionButton, optionLabel, description } = styles();
</script>
