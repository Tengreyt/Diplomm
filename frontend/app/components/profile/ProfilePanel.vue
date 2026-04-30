<template>
  <aside :class="root()" :style="panelToneStyle">
    <div :class="clanAura()" :style="clanAuraStyle" aria-hidden="true" />
    <div :class="content()">
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
    </div>
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

const clanLevel = computed(() => {
  const members = props.user.clanMembers;

  if (viewMode.value !== "clan" || members < 50) {
    return 0;
  }

  if (members < 100) {
    return 1;
  }

  return 2 + Math.floor((members - 100) / 50);
});

const panelToneStyle = computed(() => {
  if (clanLevel.value === 0) {
    return {};
  }

  const borderStrength = Math.min(0.18 + clanLevel.value * 0.05, 0.56);
  const glowStrength = Math.min(0.1 + clanLevel.value * 0.02, 0.28);

  return {
    borderColor: `rgba(31, 122, 132, ${borderStrength})`,
    boxShadow: `0 24px 70px rgba(31, 122, 132, ${glowStrength})`,
  };
});

const clanAuraStyle = computed(() => {
  if (clanLevel.value === 0) {
    return {
      opacity: 0,
    };
  }

  const strength = Math.min(0.08 + clanLevel.value * 0.03, 0.34);

  return {
    opacity: Math.min(0.72 + clanLevel.value * 0.035, 0.92),
    background: [
      `radial-gradient(circle at top right, rgba(31, 122, 132, ${strength}) 0%, transparent 36%)`,
      `radial-gradient(circle at bottom left, rgba(227, 101, 58, ${strength * 0.72}) 0%, transparent 34%)`,
      "linear-gradient(135deg, rgba(255, 250, 244, 0.72) 0%, rgba(255, 255, 255, 0.5) 52%, rgba(221, 231, 235, 0.62) 100%)",
    ].join(", "),
  };
});

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
      "relative h-[calc(100vh-8rem)] min-h-[560px] overflow-hidden rounded-panel border border-slate-900/10 bg-white/90 shadow-soft backdrop-blur-xl transition-[border-color,box-shadow] duration-700 ease-out",
    ],
    clanAura: ["pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"],
    content: [
      "profile-scrollbar relative z-10 mr-2 h-full overflow-y-auto px-6 py-6 pr-4 md:px-7 md:py-7 md:pr-5",
    ],
  },
});

const { root, clanAura, content } = styles();
</script>