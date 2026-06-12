<template>
  <div>
    <div :class="header()">
      <img
        :src="user.avatarUrl"
        alt="avatar"
        :class="avatar()"
      />
      <div>
        <p :class="kicker()">Профиль активен</p>
        <h2 :class="title()">{{ user.nickname }}</h2>
        <p :class="login()">@{{ user.login }}</p>
      </div>
      <button
        type="button"
        :class="settingsButton()"
        aria-label="Открыть настройки профиля"
        title="Настройки"
        @click="emit('openSettings')"
      >
        <Settings :class="settingsIcon()" aria-hidden="true" />
      </button>
    </div>

    <div :class="statsGrid()">
      <div :class="pointsCard()">
        <div :class="pointsTop()">
          <span :class="statLabel()">Очки</span>
          <span :class="pointsIcon()" aria-hidden="true">
            <Star class="h-5 w-5" />
          </span>
        </div>
        <strong :class="pointsValue()">{{ formatCompactCount(user.stats.points) }}</strong>
      </div>

      <button
        type="button"
        :class="clanButton()"
        @click="emit('openClan')"
      >
        <span :class="statLabel()">Клан</span>
        <span :class="clanValueRow()">
          <strong :class="statValue()">{{ user.emoji }}</strong>
          <span :class="memberBadge()">
            <span :class="memberIcon()">👥</span>
            {{ formatCompactCount(user.clanMembers) }}
          </span>
        </span>
      </button>

      <button
        type="button"
        :class="clanButton()"
        @click="emit('openClanRating')"
      >
        <span :class="statLabel()">Рейтинг</span>
        <span :class="clanValueRow()">
          <strong :class="statValue()">🏆</strong>
          <span :class="memberBadge()">
            <span :class="memberIcon()">📊</span>
            Кланы
          </span>
        </span>
      </button>

      <ProfileAiCoachCard :user="user" @open="emit('openAiCoach')" />
    </div>

    <ProfileTasks :tasks="user.tasks" :points="user.stats.points" />

    <div :class="clanNote()">
      <div :class="pillWrap()">
        <span :class="pill()">
          <span :class="pillIcon()">👥</span>
          Clan lock enabled
        </span>
      </div>
      <p>
        Эмоджи-клан закреплен за аккаунтом. Нажми на клан, чтобы открыть список
        участников прямо здесь.
      </p>
    </div>

    <button
      type="button"
      :class="logoutButton()"
      @click="emit('logout')"
    >
      Выйти
    </button>
  </div>
</template>

<script setup lang="ts">
import { Settings, Star } from "@lucide/vue";
import type { UserProfile } from "~/types/auth";
import ProfileAiCoachCard from "~/components/profile/ProfileAiCoachCard.vue";
import ProfileTasks from "~/components/profile/ProfileTasks.vue";
import { formatCompactCount } from "~/utils/format";
import { tv } from "tailwind-variants";

defineProps<{
  user: UserProfile;
}>();

const emit = defineEmits<{
  openClan: [];
  openClanRating: [];
  openAiCoach: [];
  openSettings: [];
  logout: [];
}>();

const styles = tv({
  slots: {
    header: ["grid grid-cols-[88px_1fr_auto] items-center gap-4"],
    avatar: ["h-[88px] w-[88px] rounded-[5px] object-cover"],
    settingsButton: [
      "inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition",
      "hover:bg-clan-teal/10 hover:text-clan-teal",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal",
    ],
    settingsIcon: ["h-5 w-5"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    login: ["mt-1 text-sm text-muted"],
    statsGrid: ["mt-5 grid auto-rows-[126px] grid-cols-2 gap-3"],
    pointsCard: [
      "glass-card h-full overflow-hidden rounded-2xl bg-accent-soft/50 p-4 text-left",
    ],
    pointsTop: ["flex items-center justify-between gap-2"],
    pointsIcon: [
      "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-accent-deep backdrop-blur-md",
    ],
    clanButton: [
      "glass-card h-full w-full overflow-hidden rounded-2xl p-4 text-left transition",
      "hover:border-clan-teal/50 hover:bg-clan-teal/10",
    ],
    statLabel: ["block text-xs font-semibold uppercase tracking-[0.18em] text-muted"],
    statValue: ["mt-2 block text-3xl"],
    pointsValue: ["mt-2 block text-3xl font-bold text-accent-deep"],
    clanValueRow: ["flex items-center gap-3"],
    memberBadge: [
      "mt-2 inline-flex items-center gap-1 rounded-full bg-clan-teal/10 px-3 py-1 text-sm font-semibold text-clan-teal",
    ],
    memberIcon: ["text-base leading-none"],
    clanNote: ["glass-card mt-4 rounded-2xl bg-clan-teal/10 p-4 text-sm leading-6 text-muted"],
    pillWrap: ["mb-3"],
    pill: [
      "inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-clan-teal backdrop-blur-md",
    ],
    pillIcon: ["mr-2 text-lg"],
    logoutButton: [
      "glass-control mt-5 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 transition",
      "hover:border-red-500 hover:bg-red-50 hover:text-red-600",
    ],
  },
});

const {
  header,
  avatar,
  settingsButton,
  settingsIcon,
  kicker,
  title,
  login,
  statsGrid,
  pointsCard,
  pointsTop,
  pointsIcon,
  clanButton,
  statLabel,
  statValue,
  pointsValue,
  clanValueRow,
  memberBadge,
  memberIcon,
  clanNote,
  pillWrap,
  pill,
  pillIcon,
  logoutButton,
} = styles();
</script>
