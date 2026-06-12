<template>
  <div>
    <div :class="topbar()">
      <BackButton @click="emit('back')" />
      <div>
        <p :class="kicker()">Клан против клана</p>
        <h2 :class="title()">Соревнование</h2>
      </div>
    </div>

    <div :class="list()">
      <p v-if="isLoading" :class="stateText()">Загружаем рейтинг...</p>
      <p v-else-if="errorMessage" :class="stateText()">{{ errorMessage }}</p>
      <p v-else-if="clans.length === 0" :class="stateText()">Кланы пока не найдены.</p>

      <template v-else>
        <button
          v-for="(clan, index) in clans"
          :key="clan.emoji"
          type="button"
          :class="row()"
          @click="emit('openClan', clan, index)"
        >
          <div :class="rank()">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <div :class="emoji()">{{ clan.emoji }}</div>

          <div>
            <p :class="membersLabel()">Участников: {{ formatCompactCount(clan.members) }}</p>
            <p :class="pointsLabel()">Сумма очков: {{ formatCompactCount(clan.points) }}</p>
          </div>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClanRatingItem } from "~/types/auth";
import BackButton from "~/components/ui/BackButton.vue";
import { formatCompactCount } from "~/utils/format";
import { tv } from "tailwind-variants";

defineProps<{
  clans: ClanRatingItem[];
  isLoading: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  back: [];
  openClan: [clan: ClanRatingItem, index: number];
}>();

const styles = tv({
  slots: {
    topbar: ["flex items-start gap-4"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    list: ["mt-5 grid gap-3"],
    row: [
      "glass-card grid w-full grid-cols-[40px_52px_1fr] items-center gap-3 rounded-2xl p-3 text-left transition",
      "hover:border-clan-teal/60 hover:bg-clan-teal/10",
    ],
    rank: ["text-center text-base font-semibold text-ink"],
    emoji: [
      "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-clan-teal/10 text-2xl",
    ],
    membersLabel: ["text-sm font-semibold text-ink"],
    pointsLabel: ["mt-1 text-sm text-clan-teal"],
    stateText: ["glass-card rounded-2xl p-4 text-sm text-muted"],
  },
});

const {
  topbar,
  kicker,
  title,
  list,
  row,
  rank,
  emoji,
  membersLabel,
  pointsLabel,
  stateText,
} = styles();
</script>
