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
        <p :class="kicker()">Профиль</p>
        <div :class="titleRow()">
          <h2 :class="title()">Настройки</h2>
          <IconSettings :class="titleIcon()" />
        </div>
      </div>
    </div>

    <div :class="settingsList()">
      <div :class="settingRow()">
        <span :class="settingLabel()">Никнейм</span>
        <strong :class="settingValue()">{{ user.nickname }}</strong>
      </div>
      <div :class="settingRow()">
        <span :class="settingLabel()">Логин</span>
        <strong :class="settingValue()">@{{ user.login }}</strong>
      </div>
      <div :class="settingRow()">
        <span :class="settingLabel()">Клан</span>
        <strong :class="settingValue()">{{ user.emoji }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserProfile } from "~/types/auth";
import IconSettings from "~/components/icons/IconSettings.vue";
import { tv } from "tailwind-variants";

defineProps<{
  user: UserProfile;
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
    titleRow: ["flex items-center gap-3"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    titleIcon: ["mt-2 h-6 w-6 text-clan-teal"],
    settingsList: ["mt-5 grid gap-3"],
    settingRow: [
      "rounded-2xl border border-slate-900/10 bg-white/90 p-4",
    ],
    settingLabel: ["block text-xs font-semibold uppercase tracking-[0.18em] text-muted"],
    settingValue: ["mt-2 block text-base font-semibold text-ink"],
  },
});

const {
  topbar,
  backButton,
  kicker,
  titleRow,
  title,
  titleIcon,
  settingsList,
  settingRow,
  settingLabel,
  settingValue,
} = styles();
</script>
