<template>
  <div :class="resultRoot()">
    <div :class="header()">
      <div>
        <h3 :class="resultTitle()">Результат тренировки</h3>
        <p :class="resultSubtitle()">{{ message || "Твой итог после прохождения урока" }}</p>
      </div>

      <div :class="accuracyCircleWrap()">
        <svg viewBox="0 0 120 120" :class="accuracyCircle()">
          <circle
            cx="60"
            cy="60"
            r="48"
            stroke-width="12"
            class="fill-none stroke-slate-200"
          />

          <circle
            cx="60"
            cy="60"
            r="48"
            stroke-width="12"
            class="fill-none stroke-emerald-500"
            stroke-linecap="round"
            :stroke-dasharray="circleLength"
            :stroke-dashoffset="circleOffset"
            transform="rotate(-90 60 60)"
          />
        </svg>

        <div :class="accuracyText()">
          <strong>{{ accuracy }}%</strong>
          <span>точность</span>
        </div>
      </div>
    </div>

    <div :class="resultGrid()">
      <div :class="resultCard()">
        <span>Скорость</span>
        <strong>{{ wpm }} WPM</strong>
      </div>

      <div :class="resultCard()">
        <span>Ошибки</span>
        <strong>{{ errors }}</strong>
      </div>

      <div :class="resultCard()">
        <span>Оценка</span>
        <strong>{{ resultGrade }}</strong>
      </div>

      <div :class="resultCard()">
        <span>Время</span>
        <strong>{{ formattedTime }}</strong>
      </div>
    </div>

    <div :class="bars()">
      <div>
        <div :class="barTop()">
          <span>Скорость</span>
          <strong>{{ wpm }} WPM</strong>
        </div>

        <div :class="barTrack()">
          <div
            :class="barFill({ type: 'speed' })"
            :style="{ width: `${speedPercent}%` }"
          />
        </div>
      </div>

      <div>
        <div :class="barTop()">
          <span>Точность</span>
          <strong>{{ accuracy }}%</strong>
        </div>

        <div :class="barTrack()">
          <div
            :class="barFill({ type: 'accuracy' })"
            :style="{ width: `${accuracy}%` }"
          />
        </div>
      </div>

      <div>
        <div :class="barTop()">
          <span>Ошибки</span>
          <strong>{{ errors }}</strong>
        </div>

        <div :class="barTrack()">
          <div
            :class="barFill({ type: 'errors' })"
            :style="{ width: `${errorsPercent}%` }"
          />
        </div>
      </div>
    </div>

    <div v-if="coach" :class="coachBox()">
      <div :class="coachHeader()">
        <span :class="coachKicker()">AI тренер</span>
        <span :class="coachSource()">{{ coach.source === "openai" ? "OpenAI" : "Локальный режим" }}</span>
      </div>
      <strong :class="coachPraise()">{{ coach.praise }}</strong>
      <p :class="coachAdvice()">{{ coach.advice }}</p>

      <div :class="coachTask()">
        <span>Следующее задание</span>
        <strong>{{ coach.task.title }}</strong>
        <p>{{ coach.task.description }}</p>
        <code>{{ coach.task.targetText }}</code>
      </div>
    </div>

    <button :class="retryButton()" @click="$emit('retry')">
      Попробовать снова
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { tv } from "tailwind-variants";
import type { AiCoach } from "~/types/coach";

const props = defineProps<{
  wpm: number;
  accuracy: number;
  errors: number;
  seconds: number;
  message?: string;
  coach?: AiCoach | null;
}>();

defineEmits<{
  retry: [];
}>();

const circleLength = 2 * Math.PI * 48;

const circleOffset = computed(() => {
  return circleLength - (props.accuracy / 100) * circleLength;
});

const speedPercent = computed(() => {
  return Math.min(100, Math.round((props.wpm / 100) * 100));
});

const errorsPercent = computed(() => {
  return Math.min(100, props.errors * 10);
});

const resultGrade = computed(() => {
  if (props.accuracy >= 95 && props.wpm >= 60) return "S";
  if (props.accuracy >= 90 && props.wpm >= 45) return "A";
  if (props.accuracy >= 80 && props.wpm >= 30) return "B";
  if (props.accuracy >= 70) return "C";

  return "D";
});

const formattedTime = computed(() => {
  const minutes = Math.floor(props.seconds / 60);
  const seconds = props.seconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

const styles = tv({
  slots: {
    resultRoot: [
      "profile-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-slate-900/8 bg-white/70 p-5 pr-4 md:pr-5",
    ],

    header: ["flex items-center justify-between gap-6"],

    resultTitle: ["text-2xl font-bold text-slate-950"],

    resultSubtitle: ["mt-1 text-sm text-slate-500"],

    accuracyCircleWrap: [
      "relative flex h-32 w-32 items-center justify-center",
    ],

    accuracyCircle: ["h-32 w-32"],

    accuracyText: [
      "absolute flex flex-col items-center text-center",
      "[&_strong]:text-2xl [&_strong]:font-bold [&_strong]:text-slate-950",
      "[&_span]:text-xs [&_span]:text-slate-500",
    ],

    resultGrid: ["mt-6 grid grid-cols-2 gap-3 md:grid-cols-4"],

    resultCard: [
      "glass-card rounded-2xl p-4 text-center",
      "[&_span]:block [&_span]:text-sm [&_span]:text-slate-500",
      "[&_strong]:mt-1 [&_strong]:block [&_strong]:text-xl [&_strong]:font-bold [&_strong]:text-slate-950",
    ],

    bars: ["mt-6 space-y-4"],

    barTop: [
      "mb-2 flex items-center justify-between text-sm text-slate-600",
      "[&_strong]:text-slate-950",
    ],

    barTrack: ["h-3 overflow-hidden rounded-full bg-white/50"],

    barFill: ["h-full rounded-full transition-all duration-700"],

    coachBox: ["glass-card mt-6 rounded-2xl p-4"],

    coachHeader: ["flex items-center justify-between gap-3"],

    coachKicker: ["text-xs font-bold uppercase tracking-[0.2em] text-accent-deep"],

    coachSource: ["rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-muted"],

    coachPraise: ["mt-3 block text-lg font-bold leading-snug text-slate-950"],

    coachAdvice: ["mt-2 text-sm leading-6 text-slate-600"],

    coachTask: [
      "mt-4 rounded-2xl bg-white/50 p-4 text-sm leading-6 text-slate-600",
      "[&_span]:block [&_span]:text-xs [&_span]:font-bold [&_span]:uppercase [&_span]:tracking-[0.18em] [&_span]:text-muted",
      "[&_strong]:mt-2 [&_strong]:block [&_strong]:text-base [&_strong]:text-slate-950",
      "[&_code]:mt-3 [&_code]:block [&_code]:rounded-xl [&_code]:bg-slate-950 [&_code]:px-3 [&_code]:py-2 [&_code]:font-mono [&_code]:text-xs [&_code]:leading-5 [&_code]:text-white",
    ],

    retryButton: [
      "liquid-button mt-6 w-full rounded-2xl py-3 font-semibold",
    ],
  },

  variants: {
    type: {
      speed: {
        barFill: "bg-blue-500",
      },
      accuracy: {
        barFill: "bg-emerald-500",
      },
      errors: {
        barFill: "bg-red-500",
      },
    },
  },
});

const {
  resultRoot,
  header,
  resultTitle,
  resultSubtitle,
  accuracyCircleWrap,
  accuracyCircle,
  accuracyText,
  resultGrid,
  resultCard,
  bars,
  barTop,
  barTrack,
  barFill,
  coachBox,
  coachHeader,
  coachKicker,
  coachSource,
  coachPraise,
  coachAdvice,
  coachTask,
  retryButton,
} = styles();
</script>
