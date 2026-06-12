<template>
  <div>
    <div :class="topbar()">
      <BackButton @click="emit('back')" />
      <div>
        <p :class="kicker()">AI тренер</p>
        <h2 :class="title()">Персональное задание</h2>
      </div>
    </div>

    <div :class="body()">
      <p v-if="isLoading" :class="stateText()">AI готовит рекомендации...</p>
      <p v-else-if="!coach" :class="stateText()">Пока нет задания. Пройди тренировку или обнови совет.</p>

      <template v-else>
        <section :class="heroCard()">
          <div :class="heroTop()">
            <span :class="sourceBadge()">{{ coach.source === "openai" ? "OpenAI" : "Локальный режим" }}</span>
            <span :class="sourceBadge()">{{ coach.task.minutes }} мин.</span>
          </div>
          <strong :class="heroTitle()">{{ coach.task.title }}</strong>
          <p :class="heroText()">{{ coach.task.description }}</p>
        </section>

        <section :class="sectionCard()">
          <span :class="sectionLabel()">Похвала</span>
          <p :class="sectionText()">{{ coach.praise }}</p>
        </section>

        <section :class="sectionCard()">
          <span :class="sectionLabel()">Совет</span>
          <p :class="sectionText()">{{ coach.advice }}</p>
        </section>

        <section :class="sectionCard()">
          <span :class="sectionLabel()">Фокус</span>
          <div :class="focusList()">
            <span
              v-for="key in coach.focusKeys"
              :key="key"
              :class="focusChip()"
            >
              {{ key }}
            </span>
          </div>
        </section>

        <section :class="sectionCard()">
          <span :class="sectionLabel()">Текст для следующей тренировки</span>
          <code :class="targetText()">{{ coach.task.targetText }}</code>
        </section>

        <button type="button" :class="refreshButton()" @click="emit('refresh')">
          Обновить совет
        </button>

        <button type="button" :class="startButton()" @click="emit('start')">
          Начать это задание
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";
import BackButton from "~/components/ui/BackButton.vue";
import type { AiCoach } from "~/types/coach";

defineProps<{
  coach: AiCoach | null;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  back: [];
  refresh: [];
  start: [];
}>();

const styles = tv({
  slots: {
    topbar: ["flex items-start gap-4"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    body: ["mt-5 grid gap-3"],
    stateText: ["glass-card rounded-2xl p-4 text-sm leading-6 text-muted"],
    heroCard: ["glass-card rounded-2xl bg-clan-teal/10 p-4"],
    heroTop: ["flex flex-wrap items-center gap-2"],
    sourceBadge: ["rounded-full bg-white/60 px-3 py-1 text-xs font-bold text-clan-teal"],
    heroTitle: ["mt-4 block text-2xl font-bold leading-tight text-ink"],
    heroText: ["mt-2 text-sm leading-6 text-muted"],
    sectionCard: ["glass-card rounded-2xl p-4"],
    sectionLabel: ["block text-xs font-bold uppercase tracking-[0.18em] text-muted"],
    sectionText: ["mt-2 text-sm leading-6 text-ink"],
    focusList: ["mt-3 flex flex-wrap gap-2"],
    focusChip: ["rounded-full bg-white/60 px-3 py-1 text-sm font-bold text-accent-deep"],
    targetText: [
      "mt-3 block rounded-2xl bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-white",
    ],
    refreshButton: [
      "glass-control rounded-2xl px-4 py-3 text-sm font-semibold text-ink transition hover:border-clan-teal/50 hover:text-clan-teal",
    ],
    startButton: [
      "liquid-button rounded-2xl px-4 py-3 text-sm font-semibold",
    ],
  },
});

const {
  topbar,
  kicker,
  title,
  body,
  stateText,
  heroCard,
  heroTop,
  sourceBadge,
  heroTitle,
  heroText,
  sectionCard,
  sectionLabel,
  sectionText,
  focusList,
  focusChip,
  targetText,
  refreshButton,
  startButton,
} = styles();
</script>
