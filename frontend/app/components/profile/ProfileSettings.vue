<template>
  <div>
    <div :class="topbar()">
      <BackButton @click="emit('back')" />
      <div>
        <p :class="kicker()">Профиль</p>
        <div :class="titleRow()">
          <h2 :class="title()">Настройки</h2>
          <Settings :class="titleIcon()" aria-hidden="true" />
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
import { Settings } from "@lucide/vue";
import type { UserProfile } from "~/types/auth";
import BackButton from "~/components/ui/BackButton.vue";
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
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    titleRow: ["flex items-center gap-3"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    titleIcon: ["mt-2 h-6 w-6 text-clan-teal"],
    settingsList: ["mt-5 grid gap-3"],
    settingRow: [
      "glass-card rounded-2xl p-4",
    ],
    settingLabel: ["block text-xs font-semibold uppercase tracking-[0.18em] text-muted"],
    settingValue: ["mt-2 block text-base font-semibold text-ink"],
  },
});

const {
  topbar,
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
