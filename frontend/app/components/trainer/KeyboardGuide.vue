<template>
  <section :class="root()" aria-label="Подсказка по расположению клавиш">
    <div :class="header()">
      <div>
        <span :class="eyebrow()">Подсказка по клавишам</span>
        <strong :class="nextKeyLabel()">{{ isExpanded ? `Следующая: ${nextKeyDisplay}` : nextKeyDisplay }}</strong>
      </div>
      <div :class="headerActions()">
        <button
          v-if="isExpanded && hasErrors"
          type="button"
          :class="resetButton()"
          :disabled="isResetting"
          title="Начать новый период анализа ошибок"
          @click="emit('resetHeatmap')"
        >
          <RotateCcw :class="actionIcon({ spinning: isResetting })" aria-hidden="true" />
          {{ isResetting ? "Сбрасываем..." : "Сбросить ошибки" }}
        </button>
        <button
          type="button"
          :class="toggleButton()"
          :aria-expanded="isExpanded"
          :aria-label="isExpanded ? 'Скрыть подсказку по клавишам' : 'Показать подсказку по клавишам'"
          :title="isExpanded ? 'Скрыть подсказку' : 'Показать подсказку'"
          @click="toggleGuide"
        >
          <ChevronUp v-if="isExpanded" :class="actionIcon()" aria-hidden="true" />
          <ChevronDown v-else :class="actionIcon()" aria-hidden="true" />
        </button>
      </div>
    </div>

    <p v-if="resetError" class="mt-2 text-xs font-semibold text-rose-600" role="alert">
      {{ resetError }}
    </p>

    <Transition name="keyboard-guide">
    <div v-if="isExpanded" :class="guideBody()">
      <div :class="legend()" aria-label="Интенсивность ошибок">
        <span>меньше ошибок</span>
        <i v-for="level in 4" :key="level" :style="legendStyle(level)" />
        <span>больше</span>
      </div>
      <div :class="content()">
      <div :class="keyboardViewport()">
        <div :class="keyboard()">
          <div v-for="(row, rowIndex) in keyboardRows" :key="rowIndex" :class="keyRow()">
            <div
              v-for="key in row"
              :key="key.id"
              :class="keyCap({ active: isActiveKey(key) })"
              :style="[keyWidthStyle(key.width), keyHeatStyle(key)]"
              :title="keyErrorTitle(key)"
            >
              <span>{{ key.label }}</span>
              <small v-if="keyErrors(key) > 0">{{ keyErrors(key) }}</small>
            </div>
          </div>
        </div>
      </div>
      
      </div>
    </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp, RotateCcw } from "@lucide/vue";
import { tv } from "tailwind-variants";

type FingerId =
  | "left-pinky" | "left-ring" | "left-middle" | "left-index" | "left-thumb"
  | "right-thumb" | "right-index" | "right-middle" | "right-ring" | "right-pinky";

type KeyboardKey = {
  id: string;
  label: string;
  values: string[];
  finger: FingerId;
  width?: number;
};

const props = defineProps<{
  lessonText: string;
  typedText: string;
  heatmap: Record<string, number>;
  isResetting: boolean;
  resetError: string;
}>();
const emit = defineEmits<{
  expandedChange: [value: boolean];
  resetHeatmap: [];
}>();
const guideStorageKey = "typing-arena-keyboard-guide-expanded";
const isExpanded = ref(true);

onMounted(() => {
  isExpanded.value = localStorage.getItem(guideStorageKey) !== "false";
  emit("expandedChange", isExpanded.value);
});

const toggleGuide = () => {
  isExpanded.value = !isExpanded.value;
  localStorage.setItem(guideStorageKey, String(isExpanded.value));
  emit("expandedChange", isExpanded.value);
};

const key = (label: string, values: string, finger: FingerId, width = 1): KeyboardKey => ({
  id: `${finger}-${values}`,
  label,
  values: Array.from(values),
  finger,
  width
});

const keyboardRows: KeyboardKey[][] = [
  [
    key("Ё", "ё", "left-pinky"), key("1", "1!", "left-pinky"), key("2", "2\"", "left-ring"),
    key("3", "3№", "left-middle"), key("4", "4;", "left-index"), key("5", "5%", "left-index"),
    key("6", "6:", "right-index"), key("7", "7?", "right-index"), key("8", "8*", "right-middle"),
    key("9", "9(", "right-ring"), key("0", "0)", "right-pinky"), key("−", "-_", "right-pinky"),
    key("⌫", "\b", "right-pinky", 1.65)
  ],
  [
    key("Й", "й", "left-pinky", 1.25), key("Ц", "ц", "left-ring"), key("У", "у", "left-middle"),
    key("К", "к", "left-index"), key("Е", "е", "left-index"), key("Н", "н", "right-index"),
    key("Г", "г", "right-index"), key("Ш", "ш", "right-middle"), key("Щ", "щ", "right-ring"),
    key("З", "з", "right-pinky"), key("Х", "х", "right-pinky"), key("Ъ", "ъ", "right-pinky", 1.4)
  ],
  [
    key("Ф", "ф", "left-pinky", 1.55), key("Ы", "ы", "left-ring"), key("В", "в", "left-middle"),
    key("А", "а", "left-index"), key("П", "п", "left-index"), key("Р", "р", "right-index"),
    key("О", "о", "right-index"), key("Л", "л", "right-middle"), key("Д", "д", "right-ring"),
    key("Ж", "ж", "right-pinky"), key("Э", "э", "right-pinky", 1.7)
  ],
  [
    key("Я", "я", "left-pinky", 2.05), key("Ч", "ч", "left-ring"), key("С", "с", "left-middle"),
    key("М", "м", "left-index"), key("И", "и", "left-index"), key("Т", "т", "right-index"),
    key("Ь", "ь", "right-index"), key("Б", "б", "right-middle"), key("Ю", "ю", "right-ring"),
    key(". ,", ".,", "right-pinky", 2.2)
  ],
  [key("Пробел", " ", "left-thumb", 7.2)]
];

const fingerLabels: Record<FingerId, string> = {
  "left-pinky": "Левый мизинец",
  "left-ring": "Левый безымянный",
  "left-middle": "Левый средний",
  "left-index": "Левый указательный",
  "left-thumb": "Большой палец",
  "right-thumb": "Большой палец",
  "right-index": "Правый указательный",
  "right-middle": "Правый средний",
  "right-ring": "Правый безымянный",
  "right-pinky": "Правый мизинец"
};

const nextCharacter = computed(() => props.lessonText[props.typedText.length]?.toLowerCase() ?? "");
const activeKey = computed(() => keyboardRows.flat().find((item) => item.values.includes(nextCharacter.value)) ?? null);
const activeFinger = computed<FingerId | null>(() => activeKey.value?.finger ?? null);
const nextKeyDisplay = computed(() => nextCharacter.value === " " ? "Пробел" : nextCharacter.value.toUpperCase() || "Готово");
const activeFingerLabel = computed(() => activeFinger.value ? fingerLabels[activeFinger.value] : "Клавиша не определена");
const maxErrors = computed(() => Math.max(1, ...Object.values(props.heatmap)));
const hasErrors = computed(() => Object.values(props.heatmap).some((count) => count > 0));

const isActiveKey = (item: KeyboardKey) => item.values.includes(nextCharacter.value);
const keyErrors = (item: KeyboardKey) => Math.max(...item.values.map((value) => props.heatmap[value.toLowerCase()] ?? 0));
const keyErrorTitle = (item: KeyboardKey) => {
  const errors = keyErrors(item);
  return errors ? `${errors} ошибок в последних тренировках` : "Ошибок не зафиксировано";
};
const keyWidthStyle = (width = 1) => ({ flex: `${width} 1 0%` });
const keyHeatStyle = (item: KeyboardKey) => {
  const ratio = keyErrors(item) / maxErrors.value;
  if (ratio === 0) return {};
  return {
    backgroundColor: `rgba(227, 101, 58, ${0.1 + ratio * 0.42})`,
    borderColor: `rgba(178, 68, 29, ${0.18 + ratio * 0.42})`
  };
};
const legendStyle = (level: number) => ({ backgroundColor: `rgba(227, 101, 58, ${0.08 + level * 0.11})` });

const styles = tv({
  slots: {
    root: ["rounded-xl border border-slate-200/90 bg-white/55 p-3 md:p-4"],
    header: ["flex flex-wrap items-center justify-between gap-3"],
    headerActions: ["flex items-center gap-2"],
    eyebrow: ["block text-[10px] font-bold uppercase tracking-[0.16em] text-muted"],
    nextKeyLabel: ["mt-0.5 block text-base text-ink"],
    resetButton: ["inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white/75 px-3 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent-deep disabled:opacity-60"],
    toggleButton: ["inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/75 text-muted transition hover:border-clan-teal/40 hover:text-clan-teal"],
    actionIcon: ["h-4 w-4"],
    guideBody: ["mt-3 grid gap-2.5"],
    legend: ["flex items-center justify-end gap-1 text-[10px] font-semibold text-muted", "[&_i]:h-3 [&_i]:w-3 [&_i]:rounded-sm"],
    content: ["grid gap-2.5"],
    keyboardViewport: ["min-w-0 overflow-x-auto pb-1"],
    keyboard: ["grid min-w-[620px] gap-1.5"],
    keyRow: ["flex min-h-7 justify-center gap-1.5"],
    keyCap: [
      "relative flex h-7 min-w-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white/80 text-xs font-bold text-ink shadow-sm transition-all duration-100",
      "[&_small]:absolute [&_small]:right-1 [&_small]:top-0.5 [&_small]:text-[8px] [&_small]:font-bold [&_small]:text-accent-deep"
    ],
    fingerHint: ["pt-0.5 text-center text-xs font-semibold text-clan-teal"]
  },
  variants: {
    active: {
      true: {
        keyCap: "z-10 scale-105 border-clan-teal bg-clan-teal text-white shadow-md [&_small]:text-white"
      },
      false: {}
    },
    spinning: {
      true: { actionIcon: "animate-spin" },
      false: {}
    }
  }
});

const {
  root, header, headerActions, eyebrow, nextKeyLabel, resetButton, toggleButton, actionIcon,
  guideBody, legend, content, keyboardViewport, keyboard, keyRow, keyCap, fingerHint
} = styles();
</script>
