<template>
  <div>
    <div :class="topbar()">
      <button
        type="button"
        :class="backButton()"
        @click="emit('back')"
      >
        Назад
      </button>
      <div>
        <p :class="kicker()">Клан {{ emoji }}</p>
        <div :class="titleRow()">
          <h2 :class="title()">Участники</h2>
          <span :class="memberCount()">
            <span :class="memberIcon()">👥</span>
            {{ formatCompactCount(members.length) }}
          </span>
        </div>
      </div>
    </div>

    <div :class="list()">
      <p v-if="isLoading" :class="stateText()">Загружаем список...</p>
      <p v-else-if="errorMessage" :class="stateText()">{{ errorMessage }}</p>
      <p v-else-if="members.length === 0" :class="stateText()">В клане пока никого нет.</p>

     <template v-else>
      <div
        v-for="(member, index) in members"
        :key="member.id"
        :class="memberRow()"
      >
        <div class="text-center font-bold">
          <span v-if="index === 0" class="text-yellow-500">👑1</span>
          <span v-else-if="index === 1" class="text-gray-400">👑2</span>
          <span v-else-if="index === 2" class="text-amber-700">👑3</span>
          <span v-else>{{ index + 1 }}</span>
        </div>

        <div class="flex items-center gap-3">
          <img
            :src="member.avatarUrl"
            alt="avatar"
            :class="avatar()"
          />

          <div>
            <strong :class="nickname()">{{ member.nickname }}</strong>
            <p :class="login()">@{{ member.login }}</p>
          </div>
        </div>
      </div>
    </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClanMember } from "~/types/auth";
import { formatCompactCount } from "../../utils/format";
import { tv } from "tailwind-variants";

defineProps<{
  emoji: string;
  members: ClanMember[];
  isLoading: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  back: [];
}>();

const styles = tv({
  slots: {
    topbar: ["flex items-start gap-4"],
    backButton: [
      "rounded-2xl border border-slate-900/10 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 transition",
      "hover:border-clan-teal/60 hover:bg-clan-teal/10",
    ],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    titleRow: ["flex items-center gap-3"],
    memberCount: [
      "mt-2 inline-flex items-center gap-1 rounded-full bg-clan-teal/10 px-3 py-1 text-sm font-semibold text-clan-teal",
    ],
    memberIcon: ["text-base leading-none"],
    list: ["mt-5 grid gap-3"],
    memberRow: [
      "grid grid-cols-[40px_1fr] items-center gap-3 rounded-2xl border border-slate-900/10 bg-white/90 p-3",
    ],
    avatar: ["h-14 w-14 rounded-[5px] object-cover"],
    nickname: ["block text-base font-semibold text-ink"],
    login: ["mt-1 text-sm text-muted"],
    stateText: ["rounded-2xl bg-slate-100 p-4 text-sm text-muted"],
  },
});

const {
  topbar,
  backButton,
  kicker,
  title,
  titleRow,
  memberCount,
  memberIcon,
  list,
  memberRow,
  avatar,
  nickname,
  login,
  stateText,
} = styles();
</script>
