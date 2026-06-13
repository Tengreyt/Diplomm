<template>
  <aside :class="root()" :style="panelToneStyle">
    <div :class="clanAura()" :style="clanAuraStyle" aria-hidden="true" />
    <div :class="content()">
      <ProfileSummary
        v-if="viewMode === 'profile'"
        :user="user"
        @open-clan="openClan"
        @open-clan-rating="openClanRating"
        @open-progress="openProgress"
        @open-ai-coach="openAiCoach"
        @open-settings="openSettings"
        @logout="emit('logout')"
      />

      <ProfileClanTable
        v-else-if="viewMode === 'clan'"
        :emoji="activeClanEmoji || user.emoji"
        :members="clanMembers"
        :is-loading="isClanLoading"
        :error-message="clanError"
        :clan-rank="activeClanRank"
        :clan-points="activeClanPoints"
        :total-members="activeClanMembers"
        @back="handleClanBack"
      />

      <ProfileClanRating
        v-else-if="viewMode === 'clanRating'"
        :clans="clanRating"
        :is-loading="isClanRatingLoading"
        :error-message="clanRatingError"
        @back="viewMode = 'profile'"
        @open-clan="openClanFromRating"
      />

      <ProfileAiCoachDetails
        v-else-if="viewMode === 'aiCoach'"
        :coach="profileCoach"
        :is-loading="isCoachLoading"
        @back="viewMode = 'profile'"
        @refresh="refreshAiCoach"
        @start="startAiCoachLesson"
      />

      <ProfileProgress
        v-else-if="viewMode === 'progress'"
        :progress="progress"
        :is-loading="isProgressLoading"
        :error-message="progressError"
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
import type {
  ClanMember,
  ClanRatingItem,
  ClanRatingResponse,
  ClanResponse,
  UserProfile
} from "~/types/auth";
import { tv } from "tailwind-variants";

const props = defineProps<{
  user: UserProfile;
}>();

const emit = defineEmits<{
  logout: [];
}>();

const config = useRuntimeConfig();
const viewMode = ref<"profile" | "clan" | "clanRating" | "aiCoach" | "progress" | "settings">("profile");
const clanMembers = ref<ClanMember[]>([]);
const isClanLoading = ref(false);
const clanError = ref("");
const clanRating = ref<ClanRatingItem[]>([]);
const isClanRatingLoading = ref(false);
const clanRatingError = ref("");
const activeClanEmoji = ref("");
const activeClanRank = ref<number | null>(null);
const activeClanPoints = ref<number | null>(null);
const activeClanMembers = ref<number | null>(null);
const loadedClanEmoji = ref("");
const {
  profileCoach,
  isCoachLoading,
  fetchProfileCoach,
} = useAiCoach();
const { startCoachLesson } = useTrainer();
const {
  progress,
  isProgressLoading,
  progressError,
  fetchProgress,
  clearProgress,
} = useProgress();

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
  activeClanEmoji.value = props.user.emoji;
  activeClanRank.value = null;
  activeClanPoints.value = null;
  activeClanMembers.value = null;

  await loadClanMembers(props.user.emoji);
};

const loadClanMembers = async (emoji: string) => {
  if (clanMembers.value.length > 0 && loadedClanEmoji.value === emoji) {
    return;
  }

  isClanLoading.value = true;
  clanError.value = "";

  try {
    const response = await $fetch<ClanResponse>(
      `${config.public.apiBase}/clans/${encodeURIComponent(emoji)}`
    );

    clanMembers.value = response.members;
    loadedClanEmoji.value = emoji;
  } catch {
    clanError.value = "Не удалось загрузить участников клана.";
    loadedClanEmoji.value = "";
  } finally {
    isClanLoading.value = false;
  }
};

const openSettings = () => {
  viewMode.value = "settings";
};

const openProgress = async () => {
  viewMode.value = "progress";
  await fetchProgress();
};

const openAiCoach = async () => {
  viewMode.value = "aiCoach";
  await fetchProfileCoach();
};

const refreshAiCoach = async () => {
  profileCoach.value = null;
  await fetchProfileCoach();
};

const startAiCoachLesson = async () => {
  if (!profileCoach.value) {
    return;
  }

  await startCoachLesson(profileCoach.value);
  viewMode.value = "profile";
};

const openClanRating = async () => {
  viewMode.value = "clanRating";

  if (clanRating.value.length > 0) {
    return;
  }

  isClanRatingLoading.value = true;
  clanRatingError.value = "";

  try {
    const response = await $fetch<ClanRatingResponse>(
      `${config.public.apiBase}/clans`
    );
    clanRating.value = response.clans;
  } catch {
    clanRatingError.value = "Не удалось загрузить рейтинг кланов.";
  } finally {
    isClanRatingLoading.value = false;
  }
};

const openClanFromRating = async (clan: ClanRatingItem, index: number) => {
  viewMode.value = "clan";
  activeClanEmoji.value = clan.emoji;
  activeClanRank.value = index + 1;
  activeClanPoints.value = clan.points;
  activeClanMembers.value = clan.members;

  await loadClanMembers(clan.emoji);
};

const handleClanBack = () => {
  if (activeClanRank.value !== null) {
    viewMode.value = "clanRating";
    return;
  }

  viewMode.value = "profile";
};

watch(
  () => props.user.emoji,
  () => {
    viewMode.value = "profile";
    clanMembers.value = [];
    clanError.value = "";
    clanRating.value = [];
    clanRatingError.value = "";
    activeClanEmoji.value = "";
    activeClanRank.value = null;
    activeClanPoints.value = null;
    activeClanMembers.value = null;
    loadedClanEmoji.value = "";
    clearProgress();
  }
);

const styles = tv({
  slots: {
    root: [
      "glass-panel relative h-[calc(100svh-1.25rem)] min-h-[620px] overflow-hidden rounded-panel transition-[border-color,box-shadow] duration-700 ease-out",
    ],
    clanAura: ["pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"],
    content: [
      "profile-scrollbar relative z-10 mr-2 h-full overflow-y-auto px-6 py-6 pr-4 md:px-7 md:py-7 md:pr-5",
    ],
  },
});

const { root, clanAura, content } = styles();
</script>
