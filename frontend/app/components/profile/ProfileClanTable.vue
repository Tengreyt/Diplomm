<template>
  <div>
    <div :class="topbar()">
      <BackButton @click="emit('back')" />
      <div :class="heading()">
        <p :class="kicker()">Клан {{ emoji }}</p>
        <div :class="titleRow()">
          <h2 :class="title()">Участники</h2>
          <span :class="memberCount()">
            <span :class="memberIcon()">👥</span>
            {{ formatCompactCount(totalMembers) }}
          </span>
          <span
            v-if="clanRank !== null"
            :class="ratingBadge()"
          >
            #{{ clanRank }}
          </span>
          <span
            v-if="clanPoints !== null"
            :class="pointsBadge()"
          >
            🏆 {{ clanPoints }}
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
              :alt="`Аватар ${member.nickname}`"
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
import BackButton from "~/components/ui/BackButton.vue";
import { formatCompactCount } from "~/utils/format";
import { tv } from "tailwind-variants";

const props = defineProps<{
  emoji: string;
  members: ClanMember[];
  isLoading: boolean;
  errorMessage: string;
  totalMembers?: number | null;
  clanRank?: number | null;
  clanPoints?: number | null;
}>();

const totalMembers = computed(() => props.totalMembers ?? props.members.length);

const emit = defineEmits<{
  back: [];
}>();

const styles = tv({
  slots: {
    topbar: ["flex items-start gap-4"],
    heading: ["min-w-0 flex-1"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["text-3xl font-semibold text-ink"],
    titleRow: ["mt-2 flex flex-wrap items-center gap-2"],
    memberCount: [
      "inline-flex items-center gap-1 rounded-full bg-clan-teal/10 px-3 py-1 text-sm font-semibold text-clan-teal",
    ],
    ratingBadge: [
      "inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700",
    ],
    pointsBadge: [
      "inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700",
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
  heading,
  kicker,
  title,
  titleRow,
  memberCount,
  ratingBadge,
  pointsBadge,
  memberIcon,
  list,
  memberRow,
  avatar,
  nickname,
  login,
  stateText,
} = styles();
</script>
