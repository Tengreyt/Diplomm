<template>
  <section :class="root()">
    <Transition name="fade" mode="out-in">
      <div v-if="!isFinished" key="trainer">
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
            <span :class="sectionLabel()">Текст для практики</span>
            <div :class="practiceCard()">{{ lessonText }}</div>
          </div>

          <div :class="sectionBlockRight()">
            <label :class="sectionLabel()" for="typing-area">Твоя попытка</label>
            <textarea
              id="typing-area"
              :value="typedText"
              rows="10"
              :class="textarea()"
              placeholder="Начни печатать здесь..."
              @input="emit('update:typedText', ($event.target as HTMLTextAreaElement).value)"
            ></textarea>
            <div :class="buttonRow()">
              <button type="button" :class="actionButton()" @click="emit('refreshLesson')">
                Новый текст
              </button>
            </div>
          </div>
        </div>
      </div>
      <TrainerResult
        v-else
        key="result"
        :wpm="120"
        :accuracy="props.stats.accuracy"
        :errors="props.stats.totalChars - props.stats.correctChars"
        @retry="emit('refreshLesson')"
      />
    </Transition>
  </section>
</template>

<script setup lang="ts">
import type { TrainerStats } from "~/types/trainer";
import { tv } from "tailwind-variants";
import { computed } from "vue";

const props = defineProps<{
  lessonText: string;
  lessonLevel: string;
  typedText: string;
  stats: TrainerStats;
}>();

const emit = defineEmits<{
  "update:typedText": [value: string];
  refreshLesson: [];
}>();

const isFinished = computed(() => {
  return props.typedText.length >= props.lessonText.length;
});

const styles = tv({
  slots: {
    root: [
      "min-h-[560px] rounded-panel border border-slate-900/10 bg-white/80 p-6 shadow-soft backdrop-blur-xl md:p-7 flex flex-col",
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
    sectionGrid: ["mt-6 grid items-start gap-4 xl:grid-cols-2"],
    sectionBlock: ["grid gap-3"],
    sectionBlockRight: ["flex h-full flex-col gap-3"],
    sectionLabel: ["block text-sm font-semibold leading-5 text-muted"],
    practiceCard: [
      "min-h-[274px] rounded-2xl border border-slate-900/10 bg-slate-50 p-5 leading-8 text-ink",
    ],
    textarea: [
      "min-h-[260px] resize-y rounded-2xl border border-slate-900/10 bg-white/90 p-4 text-sm leading-6 text-black",
    ],
    actionButton: [
      "rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800",
    ],
    buttonRow: ["mt-auto"],
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
  sectionBlockRight,
  sectionLabel,
  practiceCard,
  textarea,
  actionButton,
  buttonRow,
} = styles();
</script>
