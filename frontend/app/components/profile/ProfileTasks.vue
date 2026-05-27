<template>
  <section :class="root()">
    <button
      type="button"
      :class="header()"
      :aria-expanded="isExpanded"
      @click="isExpanded = !isExpanded"
    >
      <div :class="heading()">
        <span :class="tasksIcon()" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5">
            <path
              d="M8 6H20M8 12H20M8 18H20M4 6H4.01M4 12H4.01M4 18H4.01"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span>
          <span :class="kicker()">Задачи</span>
          <strong :class="title()">Очки сезона</strong>
        </span>
      </div>

      <span :class="headerRight()">
        <strong :class="pointsBadge()">{{ points }} оч.</strong>
        <svg
          :class="chevron({ open: isExpanded })"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>

    <Transition name="tasks-panel">
      <div v-if="isExpanded" :class="panel()">
        <div :class="tabs()">
          <button
            type="button"
            :class="tabButton({ active: activePeriod === 'daily' })"
            @click="activePeriod = 'daily'"
          >
            Ежедневные
          </button>
          <button
            type="button"
            :class="tabButton({ active: activePeriod === 'weekly' })"
            @click="activePeriod = 'weekly'"
          >
            Еженедельные
          </button>
        </div>

        <div :class="list()">
          <article
            v-for="task in visibleTasks"
            :key="task.id"
            :class="taskCard({ completed: task.completed })"
          >
            <div :class="taskTop()">
              <div>
                <strong :class="taskTitle()">{{ task.title }}</strong>
                <p :class="taskDescription()">{{ task.description }}</p>
              </div>
              <span :class="taskPoints()">+{{ task.points }}</span>
            </div>

            <div :class="progressTrack()">
              <div
                :class="progressFill({ completed: task.completed })"
                :style="{ width: `${getProgressPercent(task)}%` }"
              />
            </div>

            <div :class="taskBottom()">
              <span>{{ task.progress }} / {{ task.target }}</span>
              <span>{{ task.completed ? "Выполнено" : "В процессе" }}</span>
            </div>
          </article>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";
import type { UserTask } from "~/types/auth";

const props = defineProps<{
  tasks: UserTask[];
  points: number;
}>();

const activePeriod = ref<"daily" | "weekly">("daily");
const isExpanded = ref(false);

const visibleTasks = computed(() => {
  return props.tasks.filter((task) => task.period === activePeriod.value);
});

const getProgressPercent = (task: UserTask) => {
  return Math.min(100, Math.round((task.progress / task.target) * 100));
};

const styles = tv({
  slots: {
    root: ["mt-4 rounded-2xl border border-slate-900/10 bg-white/80 p-4"],
    header: [
      "flex w-full items-center justify-between gap-3 text-left",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal",
    ],
    heading: ["flex min-w-0 items-center gap-3"],
    tasksIcon: [
      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clan-teal/10 text-clan-teal",
    ],
    kicker: ["block text-xs font-bold uppercase tracking-[0.18em] text-muted"],
    title: ["mt-1 block text-lg font-semibold text-ink"],
    headerRight: ["flex shrink-0 items-center gap-2"],
    pointsBadge: [
      "rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent-deep",
    ],
    chevron: ["h-4 w-4 text-muted transition-transform"],
    panel: ["overflow-hidden"],
    tabs: ["mt-4 grid grid-cols-2 gap-2"],
    tabButton: [
      "rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm font-semibold text-muted transition",
      "hover:border-clan-teal/50 hover:text-clan-teal",
    ],
    list: ["mt-3 grid gap-3"],
    taskCard: ["rounded-2xl border border-slate-900/10 bg-white p-3"],
    taskTop: ["flex items-start justify-between gap-3"],
    taskTitle: ["block text-sm font-bold text-ink"],
    taskDescription: ["mt-1 text-xs leading-5 text-muted"],
    taskPoints: ["shrink-0 rounded-full bg-clan-teal/10 px-2.5 py-1 text-xs font-bold text-clan-teal"],
    progressTrack: ["mt-3 h-2 overflow-hidden rounded-full bg-slate-100"],
    progressFill: ["h-full rounded-full bg-clan-teal transition-all duration-500"],
    taskBottom: ["mt-2 flex items-center justify-between text-xs font-semibold text-muted"],
  },
  variants: {
    active: {
      true: {
        tabButton: "border-clan-teal bg-clan-teal/10 text-clan-teal",
      },
      false: {},
    },
    completed: {
      true: {
        taskCard: "border-emerald-500/30 bg-emerald-50/70",
        progressFill: "bg-emerald-500",
      },
      false: {},
    },
    open: {
      true: {
        chevron: "rotate-180",
      },
      false: {},
    },
  },
});

const {
  root,
  header,
  heading,
  tasksIcon,
  kicker,
  title,
  headerRight,
  pointsBadge,
  chevron,
  panel,
  tabs,
  tabButton,
  list,
  taskCard,
  taskTop,
  taskTitle,
  taskDescription,
  taskPoints,
  progressTrack,
  progressFill,
  taskBottom,
} = styles();
</script>
