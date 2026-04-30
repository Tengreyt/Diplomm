<template>
  <aside :class="root()">
    <ProfileSummary
      v-if="viewMode === 'profile'"
      :user="user"
      @open-clan="openClan"
      @open-settings="openSettings"
      @logout="emit('logout')"
    />

    <ProfileClanTable
      v-else-if="viewMode === 'clan'"
      :emoji="user.emoji"
      :members="clanMembers"
      :is-loading="isClanLoading"
      :error-message="clanError"
      @back="viewMode = 'profile'"
    />

    <ProfileSettings
      v-else
      :user="user"
      @back="viewMode = 'profile'"
    />
  </aside>
</template>

<script setup lang="ts">
import type { ClanMember, ClanResponse, UserProfile } from "~/types/auth";
import { tv } from "tailwind-variants";

const props = defineProps<{
  user: UserProfile;
}>();

const emit = defineEmits<{
  logout: [];
}>();

const config = useRuntimeConfig();
const viewMode = ref<"profile" | "clan" | "settings">("profile");
const clanMembers = ref<ClanMember[]>([]);
const isClanLoading = ref(false);
const clanError = ref("");

const openClan = async () => {
  viewMode.value = "clan";

  if (clanMembers.value.length > 0) {
    return;
  }

  isClanLoading.value = true;
  clanError.value = "";

  try {
    const response = await $fetch<ClanResponse>(
      `${config.public.apiBase}/clans/${encodeURIComponent(props.user.emoji)}`
    );

    clanMembers.value = response.members;
  } catch {
    clanError.value = "Не удалось загрузить участников клана.";
  } finally {
    isClanLoading.value = false;
  }
};

const openSettings = () => {
  viewMode.value = "settings";
};

watch(
  () => props.user.emoji,
  () => {
    viewMode.value = "profile";
    clanMembers.value = [];
    clanError.value = "";
  }
);

const styles = tv({
  slots: {
    root: [
      "rounded-panel border border-slate-900/10 bg-white/90 p-6 shadow-soft backdrop-blur-xl md:p-7",
    ],
  },
});

const { root } = styles();
</script>
