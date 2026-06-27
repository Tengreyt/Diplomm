<template>
  <div>
    <div :class="topbar()">
      <BackButton @click="emit('back')" />
      <div>
        <p :class="kicker()">Аналитика</p>
        <h2 :class="title()">Мой прогресс</h2>
      </div>
    </div>

    <div :class="body()">
      <p v-if="isLoading" :class="stateCard()">Собираем статистику...</p>
      <p v-else-if="errorMessage" :class="stateCard()">{{ errorMessage }}</p>
      <p v-else-if="!progress || progress.history.length === 0" :class="stateCard()">
        История появится после первой завершённой тренировки.
      </p>

      <template v-else>
        <div :class="summaryGrid()">
          <div :class="metricCard()">
            <span>Средняя скорость</span>
            <strong>{{ progress.summary.averageWpm }} WPM</strong>
          </div>
          <div :class="metricCard()">
            <span>Средняя точность</span>
            <strong>{{ progress.summary.averageAccuracy }}%</strong>
          </div>
          <div :class="metricCard()">
            <span>Текущая серия</span>
            <strong>{{ progress.summary.streak.current }} дн.</strong>
          </div>
          <div :class="metricCard()">
            <span>Рекомендация</span>
            <strong>{{ difficultyLabels[progress.summary.recommendedDifficulty] }}</strong>
          </div>
        </div>

        <section :class="chartCard()">
          <div :class="chartHeader()">
            <div>
              <span :class="sectionLabel()">Последние результаты</span>
              <strong :class="sectionTitle()">Скорость и точность</strong>
            </div>
            <span :class="historyCount()">{{ progress.summary.total }} тренировок</span>
          </div>

          <svg
            :class="chart()"
            viewBox="0 0 520 180"
            role="img"
            aria-label="График скорости и точности"
            @mouseleave="clearChartHover"
          >
            <line
              v-for="y in [20, 60, 100, 140]"
              :key="y"
              x1="20"
              :y1="y"
              x2="500"
              :y2="y"
              class="stroke-slate-200"
            />

            <polyline
              :points="wpmPoints"
              fill="none"
              class="stroke-clan-teal"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              :points="accuracyPoints"
              fill="none"
              class="stroke-accent"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <polyline
              :points="wpmPoints"
              fill="none"
              class="cursor-crosshair stroke-transparent"
              stroke-width="18"
              pointer-events="stroke"
              @mousemove="showChartHover($event, 'speed')"
            />
            <polyline
              :points="accuracyPoints"
              fill="none"
              class="cursor-crosshair stroke-transparent"
              stroke-width="18"
              pointer-events="stroke"
              @mousemove="showChartHover($event, 'accuracy')"
            />

            <g v-if="hoveredPoint" pointer-events="none">
              <line
                :x1="hoveredPoint.x"
                y1="20"
                :x2="hoveredPoint.x"
                y2="160"
                class="stroke-slate-400/40"
                stroke-dasharray="4 4"
              />
              <circle
                :cx="hoveredPoint.x"
                :cy="hoveredPoint.y"
                r="6"
                class="fill-white"
                :class="hoveredSeries === 'speed' ? 'stroke-clan-teal' : 'stroke-accent'"
                stroke-width="4"
              />
              <rect
                :x="tooltipX"
                :y="tooltipY"
                width="118"
                height="48"
                rx="12"
                class="fill-slate-950/95"
              />
              <text
                :x="tooltipX + 59"
                :y="tooltipY + 20"
                text-anchor="middle"
                class="fill-white text-[13px] font-bold"
              >
                {{ hoveredValue }}
              </text>
              <text
                :x="tooltipX + 59"
                :y="tooltipY + 37"
                text-anchor="middle"
                class="fill-slate-300 text-[10px] font-semibold"
              >
                {{ hoveredDate }}
              </text>
            </g>
          </svg>

          <div :class="legend()">
            <span><i class="bg-clan-teal" /> WPM</span>
            <span><i class="bg-accent" /> Точность</span>
          </div>
        </section>

        <section :class="sectionCard()">
          <span :class="sectionLabel()">Достижения</span>
          <div :class="achievementList()">
            <article
              v-for="achievement in progress.summary.achievements"
              :key="achievement.id"
              :class="achievementCard({ unlocked: achievement.unlocked })"
            >
              <span :class="achievementMark()">{{ achievement.unlocked ? "✓" : "·" }}</span>
              <div>
                <strong>{{ achievement.title }}</strong>
                <p>{{ achievement.description }}</p>
              </div>
            </article>
          </div>
        </section>

        <section :class="sectionCard()">
          <div :class="historyHeader()">
            <span :class="sectionLabel()">Последние тренировки</span>
            <button
              v-if="progress.summary.total > 10"
              type="button"
              :class="allHistoryButton()"
              @click="emit('openHistory')"
            >
              Вся история
              <ArrowRight :class="buttonIcon()" aria-hidden="true" />
            </button>
          </div>
          <div :class="historyList()">
            <div v-for="item in progress.history.slice(0, 10)" :key="item.id" :class="historyRow()">
              <div>
                <strong>{{ item.wpm }} WPM · {{ item.accuracy }}%</strong>
                <p>{{ formatResultDate(item.createdAt) }}</p>
              </div>
              <span :class="difficultyBadge()">{{ difficultyLabels[item.difficulty] }}</span>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";
import { ArrowRight } from "@lucide/vue";
import BackButton from "~/components/ui/BackButton.vue";
import { difficultyLabels } from "~/constants/trainer";
import type { ProgressResponse, TrainingResult } from "~/types/progress";

const props = defineProps<{
  progress: ProgressResponse | null;
  isLoading: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{ back: []; openHistory: [] }>();

const chartResults = computed(() => [...(props.progress?.history ?? [])].slice(0, 12).reverse());
const hoveredSeries = ref<"speed" | "accuracy" | null>(null);
const hoveredIndex = ref<number | null>(null);

const buildChartPoints = (
  results: TrainingResult[],
  value: (item: TrainingResult) => number,
  max: number
) => {
  const width = 480;
  return results.map((item, index) => {
    const x = 20 + (results.length === 1 ? width / 2 : (index / (results.length - 1)) * width);
    const y = 160 - Math.min(max, value(item)) / max * 140;
    return {
      id: item.id,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      value: value(item)
    };
  });
};

const wpmChartPoints = computed(() => buildChartPoints(
  chartResults.value,
  (item) => item.wpm,
  100
));
const accuracyChartPoints = computed(() => buildChartPoints(
  chartResults.value,
  (item) => item.accuracy,
  100
));
const wpmPoints = computed(() => wpmChartPoints.value.map((point) => `${point.x},${point.y}`).join(" "));
const accuracyPoints = computed(() => accuracyChartPoints.value.map((point) => `${point.x},${point.y}`).join(" "));

const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null || !hoveredSeries.value) return null;
  const points = hoveredSeries.value === "speed" ? wpmChartPoints.value : accuracyChartPoints.value;
  return points[hoveredIndex.value] ?? null;
});
const hoveredResult = computed(() => hoveredIndex.value === null
  ? null
  : chartResults.value[hoveredIndex.value] ?? null
);
const hoveredValue = computed(() => {
  if (!hoveredResult.value) return "";
  return hoveredSeries.value === "speed"
    ? `${hoveredResult.value.wpm} WPM`
    : `${hoveredResult.value.accuracy}% точности`;
});
const hoveredDate = computed(() => hoveredResult.value
  ? new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(hoveredResult.value.createdAt))
  : ""
);
const tooltipX = computed(() => Math.max(8, Math.min(394, (hoveredPoint.value?.x ?? 0) - 59)));
const tooltipY = computed(() => Math.max(6, Math.min(126, (hoveredPoint.value?.y ?? 0) - 58)));

const showChartHover = (event: MouseEvent, series: "speed" | "accuracy") => {
  const svg = event.currentTarget instanceof SVGElement ? event.currentTarget.ownerSVGElement : null;
  if (!svg || chartResults.value.length === 0) return;

  const bounds = svg.getBoundingClientRect();
  const chartX = (event.clientX - bounds.left) / bounds.width * 520;
  const ratio = Math.max(0, Math.min(1, (chartX - 20) / 480));

  hoveredSeries.value = series;
  hoveredIndex.value = chartResults.value.length === 1
    ? 0
    : Math.round(ratio * (chartResults.value.length - 1));
};

const clearChartHover = () => {
  hoveredSeries.value = null;
  hoveredIndex.value = null;
};

const formatResultDate = (value: string) => new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
}).format(new Date(value));

const styles = tv({
  slots: {
    topbar: ["flex items-start gap-4"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    body: ["mt-5 grid gap-4"],
    stateCard: ["glass-card rounded-2xl p-4 text-sm leading-6 text-muted"],
    summaryGrid: ["grid grid-cols-2 gap-3"],
    metricCard: [
      "glass-card rounded-2xl p-4",
      "[&_span]:block [&_span]:text-xs [&_span]:font-semibold [&_span]:uppercase [&_span]:tracking-[0.12em] [&_span]:text-muted",
      "[&_strong]:mt-2 [&_strong]:block [&_strong]:text-xl [&_strong]:text-ink",
    ],
    chartCard: ["glass-card rounded-2xl p-4"],
    chartHeader: ["flex items-start justify-between gap-3"],
    sectionLabel: ["block text-xs font-bold uppercase tracking-[0.18em] text-muted"],
    sectionTitle: ["mt-1 block text-lg text-ink"],
    historyCount: ["rounded-full bg-clan-teal/10 px-3 py-1 text-xs font-bold text-clan-teal"],
    chart: ["mt-4 h-auto w-full overflow-visible"],
    legend: [
      "mt-2 flex gap-4 text-xs font-semibold text-muted",
      "[&_span]:inline-flex [&_span]:items-center [&_span]:gap-2",
      "[&_i]:h-2.5 [&_i]:w-2.5 [&_i]:rounded-full",
    ],
    sectionCard: ["glass-card rounded-2xl p-4"],
    achievementList: ["mt-3 grid gap-2"],
    achievementCard: [
      "grid grid-cols-[32px_1fr] gap-3 rounded-xl border border-white/60 bg-white/35 p-3 text-muted",
      "[&_strong]:block [&_strong]:text-sm [&_p]:mt-1 [&_p]:text-xs [&_p]:leading-5",
    ],
    achievementMark: ["flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 font-bold"],
    historyList: ["mt-3 grid gap-2"],
    historyHeader: ["flex items-center justify-between gap-3"],
    allHistoryButton: [
      "inline-flex items-center gap-1.5 text-xs font-bold text-clan-teal transition hover:text-accent-deep",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal"
    ],
    buttonIcon: ["h-3.5 w-3.5"],
    historyRow: [
      "flex items-center justify-between gap-3 rounded-xl bg-white/40 p-3",
      "[&_strong]:text-sm [&_strong]:text-ink [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted",
    ],
    difficultyBadge: ["shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-deep"],
  },
  variants: {
    unlocked: {
      true: {
        achievementCard: "border-emerald-500/25 bg-emerald-50/70 text-ink",
        achievementMark: "bg-emerald-500 text-white",
      },
      false: {},
    },
  },
});

const {
  topbar, kicker, title, body, stateCard, summaryGrid, metricCard, chartCard, chartHeader,
  sectionLabel, sectionTitle, historyCount, chart, legend, sectionCard, achievementList,
  achievementCard, achievementMark, historyList, historyHeader, allHistoryButton, buttonIcon,
  historyRow, difficultyBadge
} = styles();
</script>
