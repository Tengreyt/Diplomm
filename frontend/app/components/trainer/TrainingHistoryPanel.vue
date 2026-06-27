<template>
  <section :class="root()">
    <template v-if="activeDetailId">
      <div :class="header()">
        <button type="button" :class="iconButton()" aria-label="Вернуться к истории" title="Вернуться к истории" @click="closeHistoryDetail">
          <ArrowLeft :class="icon()" aria-hidden="true" />
        </button>
        <div>
          <p :class="kicker()">Результат тренировки</p>
          <h2 :class="title()">{{ activeDetail ? formatFullDate(activeDetail.createdAt) : "Загрузка..." }}</h2>
        </div>
      </div>

      <p v-if="detailError" :class="stateMessage()">{{ detailError }}</p>
      <div v-else-if="!activeDetail" :class="stateMessage()">Загружаем подробности...</div>

      <div v-else :class="detailBody()">
        <div :class="metricGrid()">
          <article v-for="metric in detailMetrics" :key="metric.label" :class="metricCard()">
            <component :is="metric.icon" :class="metricIcon()" aria-hidden="true" />
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </article>
        </div>

        <div :class="detailMeta()">
          <span>{{ difficultyLabels[activeDetail.difficulty] }}</span>
          <span>{{ sourceLabels[activeDetail.source] }}</span>
          <span>{{ activeDetail.correctChars }} из {{ activeDetail.totalChars }} символов верно</span>
        </div>

        <section :class="contentSection()">
          <div :class="sectionHeading()">
            <Type :class="sectionIcon()" aria-hidden="true" />
            <h3>Текст тренировки</h3>
          </div>
          <p :class="lessonText()">{{ activeDetail.lessonText }}</p>
        </section>

        <section :class="contentSection()">
          <div :class="sectionHeading()">
            <ScanSearch :class="sectionIcon()" aria-hidden="true" />
            <h3>Анализ набора</h3>
          </div>

          <div v-if="hasAnalysis" :class="analysisGrid()">
            <div>
              <span :class="analysisLabel()">Символы для практики</span>
              <div :class="focusList()">
                <span v-for="character in activeDetail.analysis.focusChars" :key="character">{{ character }}</span>
              </div>
            </div>
            <div v-if="activeDetail.analysis.pairs?.length">
              <span :class="analysisLabel()">Частые замены</span>
              <div :class="pairList()">
                <span v-for="pair in activeDetail.analysis.pairs" :key="pair.value">
                  {{ pair.value }} <strong>×{{ pair.count }}</strong>
                </span>
              </div>
            </div>
          </div>
          <p v-else :class="emptyAnalysis()">Ошибочных сочетаний в этой тренировке не зафиксировано.</p>
        </section>
      </div>
    </template>

    <template v-else>
      <div :class="header()">
        <button type="button" :class="backButton()" @click="emit('close')">
          <ArrowLeft :class="icon()" aria-hidden="true" />
          <span>Назад к тренажёру</span>
        </button>
        <div>
          <p :class="kicker()">Аналитика</p>
          <h2 :class="title()">История тренировок</h2>
        </div>
        <span v-if="total" :class="totalBadge()">{{ total }} всего</span>
      </div>

      <p v-if="historyError && history.length === 0" :class="stateMessage()">{{ historyError }}</p>
      <p v-else-if="isHistoryLoading && history.length === 0" :class="stateMessage()">Загружаем историю...</p>
      <p v-else-if="history.length === 0" :class="stateMessage()">Завершённые тренировки появятся здесь.</p>

      <div v-else :class="historyList()">
        <button
          v-for="item in history"
          :key="item.id"
          type="button"
          :class="historyRow()"
          @click="fetchHistoryDetail(item.id)"
        >
          <span :class="dateBlock()">
            <CalendarDays :class="rowIcon()" aria-hidden="true" />
            <span>
              <strong>{{ formatDay(item.createdAt) }}</strong>
              <small>{{ formatTime(item.createdAt) }}</small>
            </span>
          </span>
          <span :class="resultMetrics()">
            <span><strong>{{ item.wpm }}</strong> WPM</span>
            <span><strong>{{ item.accuracy }}%</strong> точность</span>
            <span><strong>{{ item.errors }}</strong> ошибок</span>
          </span>
          <span :class="difficultyBadge()">{{ difficultyLabels[item.difficulty] }}</span>
          <ChevronRight :class="chevron()" aria-hidden="true" />
        </button>
      </div>

      <button
        v-if="historyNextCursor"
        type="button"
        :class="loadMoreButton()"
        :disabled="isHistoryLoading"
        @click="loadMoreHistory"
      >
        <LoaderCircle v-if="isHistoryLoading" :class="loadingIcon()" aria-hidden="true" />
        {{ isHistoryLoading ? "Загружаем..." : "Показать ещё" }}
      </button>
    </template>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Gauge,
  LoaderCircle,
  ScanSearch,
  Target,
  Timer,
  TriangleAlert,
  Type
} from "@lucide/vue";
import { tv } from "tailwind-variants";
import { difficultyLabels } from "~/constants/trainer";

const props = defineProps<{ total: number }>();
const emit = defineEmits<{ close: [] }>();
const {
  history,
  historyNextCursor,
  isHistoryLoading,
  historyError,
  historyDetails,
  activeDetailId,
  detailError,
  loadMoreHistory,
  fetchHistoryDetail,
  closeHistoryDetail
} = useProgress();

const sourceLabels = {
  catalog: "Каталог",
  adaptive: "Адаптивный режим",
  coach: "AI-тренер"
} as const;
const activeDetail = computed(() => activeDetailId.value
  ? historyDetails.value[activeDetailId.value] ?? null
  : null
);
const detailMetrics = computed(() => activeDetail.value ? [
  { label: "Скорость", value: `${activeDetail.value.wpm} WPM`, icon: Gauge },
  { label: "Точность", value: `${activeDetail.value.accuracy}%`, icon: Target },
  { label: "Ошибки", value: activeDetail.value.errors, icon: TriangleAlert },
  { label: "Время", value: formatDuration(activeDetail.value.seconds), icon: Timer }
] : []);
const hasAnalysis = computed(() => Boolean(
  activeDetail.value?.analysis.focusChars?.length || activeDetail.value?.analysis.pairs?.length
));

const formatDay = (value: string) => new Intl.DateTimeFormat("ru-RU", {
  day: "numeric", month: "long", year: "numeric"
}).format(new Date(value));
const formatTime = (value: string) => new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit", minute: "2-digit"
}).format(new Date(value));
const formatFullDate = (value: string) => `${formatDay(value)}, ${formatTime(value)}`;
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes} мин ${remainder} сек` : `${remainder} сек`;
};

const styles = tv({
  slots: {
    root: ["profile-scrollbar glass-panel flex h-[calc(100svh-1.25rem)] flex-col overflow-y-auto rounded-panel p-5 md:p-7"],
    header: ["flex min-h-12 items-center gap-4 border-b border-slate-900/8 pb-5"],
    iconButton: [
      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-900/10 bg-white/70 text-muted transition",
      "hover:border-clan-teal/50 hover:bg-clan-teal/10 hover:text-clan-teal",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal"
    ],
    backButton: [
      "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-900/10 bg-white/70 px-3 text-sm font-semibold text-muted transition",
      "hover:border-clan-teal/50 hover:bg-clan-teal/10 hover:text-clan-teal",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal"
    ],
    icon: ["h-4 w-4"],
    kicker: ["text-xs font-bold uppercase tracking-[0.2em] text-accent-deep"],
    title: ["mt-1 text-2xl font-semibold text-ink md:text-3xl"],
    totalBadge: ["ml-auto rounded-full bg-clan-teal/10 px-3 py-1.5 text-xs font-bold text-clan-teal"],
    stateMessage: ["mt-5 rounded-xl border border-slate-200 bg-white/60 p-5 text-sm text-muted"],
    historyList: ["mt-5 grid gap-2"],
    historyRow: [
      "grid min-h-20 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 text-left transition md:grid-cols-[minmax(180px,0.9fr)_minmax(280px,1.4fr)_auto_auto]",
      "hover:border-clan-teal/40 hover:bg-white/85 hover:shadow-sm",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clan-teal"
    ],
    dateBlock: ["flex min-w-0 items-center gap-3", "[&_strong]:block [&_strong]:truncate [&_strong]:text-sm [&_strong]:text-ink", "[&_small]:mt-0.5 [&_small]:block [&_small]:text-xs [&_small]:text-muted"],
    rowIcon: ["h-5 w-5 shrink-0 text-clan-teal"],
    resultMetrics: ["col-span-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted md:col-span-1", "[&_strong]:text-sm [&_strong]:text-ink"],
    difficultyBadge: ["hidden shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-deep md:inline-flex"],
    chevron: ["h-4 w-4 shrink-0 text-slate-400"],
    loadMoreButton: ["mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-clan-teal/50 hover:text-clan-teal disabled:opacity-60"],
    loadingIcon: ["h-4 w-4 animate-spin"],
    detailBody: ["mt-5 grid gap-5"],
    metricGrid: ["grid grid-cols-2 gap-3 lg:grid-cols-4"],
    metricCard: ["grid min-h-28 grid-cols-[auto_1fr] items-center gap-x-2 rounded-xl border border-slate-200 bg-white/65 p-4", "[&_span]:text-xs [&_span]:font-semibold [&_span]:uppercase [&_span]:text-muted", "[&_strong]:col-span-2 [&_strong]:mt-2 [&_strong]:text-xl [&_strong]:text-ink"],
    metricIcon: ["h-4 w-4 text-clan-teal"],
    detailMeta: ["flex flex-wrap gap-2 text-xs font-semibold text-muted", "[&_span]:rounded-full [&_span]:bg-slate-100 [&_span]:px-3 [&_span]:py-1.5"],
    contentSection: ["border-t border-slate-900/8 pt-5"],
    sectionHeading: ["flex items-center gap-2", "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink"],
    sectionIcon: ["h-4 w-4 text-accent-deep"],
    lessonText: ["mt-3 rounded-xl border border-slate-200 bg-white/70 p-4 text-base font-medium leading-8 text-ink"],
    analysisGrid: ["mt-4 grid gap-5 md:grid-cols-2"],
    analysisLabel: ["text-xs font-bold uppercase text-muted"],
    focusList: ["mt-2 flex flex-wrap gap-2", "[&_span]:flex [&_span]:h-9 [&_span]:min-w-9 [&_span]:items-center [&_span]:justify-center [&_span]:rounded-lg [&_span]:bg-clan-teal/10 [&_span]:px-2 [&_span]:font-mono [&_span]:font-bold [&_span]:text-clan-teal"],
    pairList: ["mt-2 flex flex-wrap gap-2", "[&_span]:rounded-lg [&_span]:bg-rose-50 [&_span]:px-3 [&_span]:py-2 [&_span]:font-mono [&_span]:text-sm [&_span]:text-rose-700"],
    emptyAnalysis: ["mt-3 text-sm text-muted"]
  }
});

const {
  root, header, iconButton, backButton, icon, kicker, title, totalBadge, stateMessage, historyList,
  historyRow, dateBlock, rowIcon, resultMetrics, difficultyBadge, chevron, loadMoreButton,
  loadingIcon, detailBody, metricGrid, metricCard, metricIcon, detailMeta, contentSection,
  sectionHeading, sectionIcon, lessonText, analysisGrid, analysisLabel, focusList, pairList,
  emptyAnalysis
} = styles();
</script>
