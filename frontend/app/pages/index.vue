<template>
  <main :class="root()">
    <HomeVideoHero v-if="!currentUser" />

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
  currentUser,
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
  await restoreSession(fetchLesson);
});

const handleLogout = () => {
  void logout();
  resetTrainer();
  closeHistoryDetail();
  mainView.value = "trainer";
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
