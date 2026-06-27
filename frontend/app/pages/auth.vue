<template>
  <main :class="root()">
    <section v-if="!currentUser" :class="guestShell()">
      <div :class="guestHeader()">
        <NuxtLink to="/" :class="backLink()">Главная</NuxtLink>
        <p :class="kicker()">Профиль</p>
        <h1 :class="title()">Вход и регистрация</h1>
      </div>

      <div :class="guestGrid()">
        <AuthPanel
          :auth-mode="authMode"
          :is-pending="isPending"
          :auth-message="authMessage"
          :register-form="registerForm"
          :login-form="loginForm"
          :clan-pitch="clanPitch"
          @switch-mode="switchMode"
          @select-avatar="selectAvatar"
          @choose-emoji="chooseEmoji"
          @register="handleRegister"
          @login="handleLogin"
        />
        <HomePitchCard />
      </div>
    </section>

    <section v-else :class="appGrid()">
      <ProfilePanel :user="currentUser" @logout="handleLogout" @open-history="openHistory" />
      <Transition name="workspace" mode="out-in">
        <TrainingHistoryPanel
          v-if="mainView === 'history'"
          key="history"
          :total="progress?.summary.total ?? currentUser.stats.testsCompleted"
          @close="mainView = 'trainer'"
        />
        <TrainerPanel
          v-else
          key="trainer"
          :lesson-text="lessonText"
          :lesson-level="lessonLevel"
          :selected-difficulty="selectedDifficulty"
          :selected-pace="selectedPace"
          :typed-text="typedText"
          :keyboard-heatmap="keyboardHeatmap"
          :is-heatmap-resetting="isHeatmapResetting"
          :heatmap-reset-error="heatmapResetError"
          :stats="stats"
          :result-message="resultMessage"
          :coach="aiCoach"
          @update:difficulty="selectDifficulty"
          @update:pace="selectPace"
          @update:typed-text="updateTypedText"
          @reset-heatmap="resetKeyboardHeatmap"
          @refresh-lesson="fetchLesson"
        />
      </Transition>
    </section>
  </main>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";
import TrainingHistoryPanel from "~/components/trainer/TrainingHistoryPanel.vue";

const {
  authMode,
  isPending,
  authMessage,
  currentUser,
  registerForm,
  loginForm,
  clanPitch,
  switchMode,
  selectAvatar,
  chooseEmoji,
  registerUser,
  loginUser,
  restoreSession,
  logout
} = useAuth();

const {
  lessonText,
  lessonLevel,
  selectedDifficulty,
  selectedPace,
  typedText,
  keyboardHeatmap,
  isHeatmapResetting,
  heatmapResetError,
  stats,
  aiCoach,
  resultMessage,
  fetchLesson,
  selectDifficulty,
  selectPace,
  resetKeyboardHeatmap,
  updateTypedText,
  resetTrainer
} = useTrainer();
const { progress, closeHistoryDetail, fetchHistory } = useProgress();
const mainView = ref<"trainer" | "history">("trainer");

const openHistory = () => {
  mainView.value = "history";
  void fetchHistory({ reset: true });
};

onMounted(async () => {
  await restoreSession(async () => {
    await fetchLesson();
    await navigateTo("/");
  });
});

const handleRegister = async () => {
  await registerUser(async () => {
    await fetchLesson();
    await navigateTo("/");
  });
};

const handleLogin = async () => {
  await loginUser(async () => {
    await fetchLesson();
    await navigateTo("/");
  });
};

const handleLogout = () => {
  void logout();
  resetTrainer();
  closeHistoryDetail();
  mainView.value = "trainer";
};

const styles = tv({
  slots: {
    root: ["page-shell"],
    guestShell: ["mx-auto max-w-7xl"],
    guestHeader: ["mb-6"],
    backLink: [
      "glass-control inline-flex rounded-full px-4 py-2 text-sm font-semibold text-muted transition",
      "hover:border-clan-teal/50 hover:text-clan-teal",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal",
    ],
    kicker: ["mt-7 text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["mt-2 text-4xl font-semibold leading-tight text-ink md:text-5xl"],
    guestGrid: ["grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"],
    appGrid: ["grid items-stretch gap-6 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.4fr)]"],
  },
});

const {
  root,
  guestShell,
  guestHeader,
  backLink,
  kicker,
  title,
  guestGrid,
  appGrid,
} = styles();
</script>
