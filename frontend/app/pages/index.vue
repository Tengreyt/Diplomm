<template>
  <main :class="root()">
    <BrandHero />

    <section v-if="!currentUser" :class="guestGrid()">
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
    </section>

    <section v-else :class="appGrid()">
      <ProfilePanel :user="currentUser" @logout="handleLogout" />
      <TrainerPanel
        :lesson-text="lessonText"
        :lesson-level="lessonLevel"
        :typed-text="typedText"
        :stats="stats"
        @update:typed-text="typedText = $event"
        @refresh-lesson="fetchLesson"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";

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
  typedText,
  stats,
  fetchLesson,
  resetTrainer
} = useTrainer();

onMounted(async () => {
  await restoreSession(fetchLesson);
});

const handleRegister = async () => {
  await registerUser(fetchLesson);
};

const handleLogin = async () => {
  await loginUser(fetchLesson);
};

const handleLogout = () => {
  logout();
  resetTrainer();
};

const styles = tv({
  slots: {
    root: ["page-shell"],
    guestGrid: ["grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"],
    appGrid: ["grid gap-6 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.4fr)]"],
  },
});

const { root, guestGrid, appGrid } = styles();
</script>