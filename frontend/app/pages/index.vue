<script setup lang="ts">
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
</script>

<template>
  <main class="page-shell">
    <BrandHero />

    <section v-if="!currentUser" class="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
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

    <section v-else class="grid gap-6 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.4fr)]">
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
