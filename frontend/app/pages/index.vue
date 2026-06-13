<template>
  <main :class="root()">
    <HomeVideoHero v-if="!currentUser" />

    <section v-else :class="appGrid()">
      <ProfilePanel :user="currentUser" @logout="handleLogout" />
      <TrainerPanel
        :lesson-text="lessonText"
        :lesson-level="lessonLevel"
        :selected-difficulty="selectedDifficulty"
        :typed-text="typedText"
        :stats="stats"
        :result-message="resultMessage"
        :coach="aiCoach"
        @update:difficulty="selectDifficulty"
        @update:typed-text="updateTypedText"
        @refresh-lesson="fetchLesson"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";

const {
  currentUser,
  restoreSession,
  logout
} = useAuth();

const {
  lessonText,
  lessonLevel,
  selectedDifficulty,
  typedText,
  stats,
  aiCoach,
  resultMessage,
  fetchLesson,
  selectDifficulty,
  updateTypedText,
  resetTrainer
} = useTrainer();

onMounted(async () => {
  await restoreSession(fetchLesson);
});

const handleLogout = () => {
  void logout();
  resetTrainer();
};

const styles = tv({
  slots: {
    root: ["page-shell"],
    appGrid: ["grid items-stretch gap-6 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.4fr)]"],
  },
});

const {
  root,
  appGrid,
} = styles();
</script>
