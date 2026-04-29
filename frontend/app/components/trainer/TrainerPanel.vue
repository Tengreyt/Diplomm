<template>
  <section :class="root()">
    <div :class="header()">
      <div>
        <p :class="kicker()">Режим тренировки</p>
        <h2 :class="title()">Личный тренажер</h2>
      </div>
      <span :class="badge()">{{ lessonLevel }}</span>
    </div>

    <div :class="statsGrid()">
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
    </div>

    <div :class="sectionGrid()">
      <div :class="sectionBlock()">
        <p :class="sectionLabel()">Текст для практики</p>
        <div :class="practiceCard()">{{ lessonText }}</div>
      </div>

      <div :class="sectionBlock()">
        <label :class="sectionLabel()" for="typing-area">Твоя попытка</label>
        <textarea
          id="typing-area"
          :value="typedText"
          rows="10"
          :class="[textarea(), 'text-black resize-none']"
          placeholder="Начни печатать здесь..."
          @input="emit('update:typedText', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>
    </div>

    <div :class="buttonRow()">
      <button type="button" :class="actionButton()" @click="emit('refreshLesson')">
        Новый текст
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TrainerStats } from "~/types/trainer";
import { tv } from "tailwind-variants";

defineProps<{
  lessonText: string;
  lessonLevel: string;
  typedText: string;
  stats: TrainerStats;
}>();

const emit = defineEmits<{
  "update:typedText": [value: string];
  refreshLesson: [];
}>();

const styles = tv({
  slots: {
    root: [
      "rounded-panel border border-slate-900/10 bg-white/80 shadow-soft backdrop-blur-xl p-6 md:p-7",
    ],
    header: ["flex flex-col justify-between gap-4 md:flex-row md:items-start"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    badge: [
      "inline-flex items-center rounded-2xl border border-accent-deep bg-accent-deep/10 px-3 py-1 text-sm font-semibold text-accent-deep",
    ],
    statsGrid: ["mt-6 grid gap-3 md:grid-cols-3"],
    statCard: ["rounded-2xl border border-slate-900/10 bg-white/90 p-4"],
    statLabel: [
      "block text-xs font-semibold uppercase tracking-[0.18em] text-muted",
    ],
    statValue: ["mt-2 block text-3xl"],
    sectionGrid: ["mt-6 grid gap-4 xl:grid-cols-2"],
    sectionBlock: ["grid gap-3"],
    sectionLabel: ["text-sm font-semibold text-muted"],
    practiceCard: [
      "min-h-[260px] rounded-2xl border border-slate-900/10 bg-slate-50 p-5 leading-8 text-ink",
    ],
    textarea: [
      "min-h-[260px] rounded-2xl border border-slate-900/10 bg-white/90 p-4 text-sm leading-6",
    ],
    actionButton: [
      "rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800",
    ],
    buttonRow: ["mt-5"],
  },
});

const {
  root,
  header,
  kicker,
  title,
  badge,
  statsGrid,
  statCard,
  statLabel,
  statValue,
  sectionGrid,
  sectionBlock,
  sectionLabel,
  practiceCard,
  textarea,
  actionButton,
  buttonRow,
} = styles();
</script>

