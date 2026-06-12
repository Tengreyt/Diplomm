<template>
  <button type="button" :class="card()" @click="emit('open')">
    <div :class="topRow()">
      <span :class="label()">AI-задание</span>
      <Sparkles :class="icon()" aria-hidden="true" />
    </div>

    <div v-if="isLoading" :class="stateText()">
      Думаю над заданием...
    </div>

    <div v-else-if="coach" :class="content()">
      <strong :class="title()">{{ coach.task.title }}</strong>
      <div :class="focusRow()">
        <span>{{ coach.task.focus }}</span>
        <span>{{ coach.task.minutes }} мин.</span>
      </div>
    </div>

    <span
      v-else
      :class="retryButton()"
    >
      Получить задание
    </span>
  </button>
</template>

<script setup lang="ts">
import { Sparkles } from "@lucide/vue";
import { tv } from "tailwind-variants";
import type { UserProfile } from "~/types/auth";

const props = defineProps<{
  user: UserProfile;
}>();

const emit = defineEmits<{
  open: [];
}>();

const {
  profileCoach: coach,
  isCoachLoading: isLoading,
  fetchProfileCoach: loadCoach,
} = useAiCoach();

onMounted(loadCoach);

watch(
  () => [
    props.user.id,
    props.user.stats.testsCompleted,
    props.user.stats.bestAccuracy,
    props.user.stats.bestWpm,
    props.user.stats.points,
  ],
  () => {
    coach.value = null;
    void loadCoach();
  }
);

const styles = tv({
  slots: {
    card: [
      "glass-card h-full min-h-0 w-full overflow-hidden rounded-2xl p-4 text-left transition",
      "hover:border-clan-teal/50 hover:bg-clan-teal/10",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal",
    ],
    topRow: ["flex items-center justify-between gap-2"],
    label: ["block text-xs font-semibold uppercase tracking-[0.18em] text-muted"],
    icon: ["h-5 w-5 text-accent-deep"],
    content: ["mt-3"],
    title: ["line-clamp-2 block text-lg font-bold leading-snug text-ink"],
    focusRow: ["mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-clan-teal"],
    stateText: ["mt-4 text-sm font-semibold leading-5 text-muted"],
    retryButton: [
      "mt-4 inline-flex rounded-full bg-white/60 px-3 py-2 text-xs font-semibold text-clan-teal transition",
      "hover:bg-clan-teal/10",
    ],
  },
});

const {
  card,
  topRow,
  label,
  icon,
  content,
  title,
  focusRow,
  stateText,
  retryButton,
} = styles();
</script>
