<template>
  <section :class="root()">
    <Transition name="fade" mode="out-in">
      <div v-if="!isFinished" key="trainer">
        <div :class="header()">
          <div>
            <p :class="kicker()">Режим тренировки</p>
            <h2 :class="title()">Личный тренажер</h2>
          </div>
          <span :class="badge()">{{ lessonLevel }}</span>
        </div>

        <div :class="statsGrid()">
          <div :class="statCard()">
            <span :class="statLabel()">Время</span>
            <strong :class="statValue()">{{ formattedTime }}</strong>
          </div>

          <div :class="statCard()">
            <span :class="statLabel()">Символов</span>
            <strong :class="statValue()">{{ stats.totalChars }}</strong>
          </div>
          <div :class="statCard()">
            <span :class="statLabel()">Верно</span>
            <strong :class="statValue()">{{ stats.correctChars }}</strong>
          </div>

          <div :class="statCard()">
            <span :class="statLabel()">Точность</span>
            <strong :class="statValue()">{{ stats.accuracy }}%</strong>
          </div>

          <div :class="statCard()">
            <span :class="statLabel()">Скорость</span>
            <strong :class="statValue()">{{ stats.wpm }} WPM</strong>
          </div>
        </div>

        <div :class="sectionBlock()">
          <div :class="sectionHeader()">
            <span :class="sectionLabel()">Печатай текст</span>
            <span :class="progressText()">{{ typedText.length }} / {{ lessonText.length }}</span>
          </div>
          <div
            ref="typingSurface"
            role="textbox"
            aria-label="Поле тренировки печати"
            :aria-multiline="true"
            :class="typingCard()"
            tabindex="0"
            @click="focusTypingSurface"
            @keydown="handleKeydown"
            @paste="handlePaste"
          >
            <span v-if="typedText.length === 0" :class="startCursorWrap()">
              <span :class="cursor()" aria-hidden="true"></span>
            </span>
            <template v-for="token in lessonTokens" :key="token.id">
              <span v-if="token.kind === 'word'" :class="word()">
                <span
                  v-for="char in token.characters"
                  :key="char.id"
                  :class="character({ state: getCharacterState(char.index) })"
                >
                  {{ getCharacterText(char.index, char.value) }}
                  <span
                    v-if="char.index === typedText.length - 1"
                    :class="cursor()"
                    aria-hidden="true"
                  ></span>
                </span>
              </span>
              <span
                v-for="char in token.characters"
                v-else
                :key="char.id"
                :class="character({
                  state: getCharacterState(char.index),
                  space: true,
                })"
              >
                {{ getCharacterText(char.index, char.value) }}
                <span
                  v-if="char.index === typedText.length - 1"
                  :class="cursor()"
                  aria-hidden="true"
                ></span>
              </span>
            </template>
            <span
              v-if="typedText.length >= lessonText.length"
              :class="cursor({ position: 'end' })"
              aria-hidden="true"
            ></span>
          </div>
          <div :class="buttonRow()">
            <button type="button" :class="actionButton()" @click="emit('refreshLesson')">
              Новый текст
            </button>
          </div>
        </div>
      </div>
      <TrainerResult
        v-else
        key="result"
        :wpm="props.stats.wpm"
        :accuracy="props.stats.accuracy"
        :errors="props.stats.errors"
        :seconds="props.stats.seconds"
        @retry="emit('refreshLesson')"
      />
    </Transition>
  </section>
</template>

<script setup lang="ts">
import type { TrainerStats } from "~/types/trainer";
import { tv } from "tailwind-variants";
import { computed, nextTick, onMounted, ref, watch } from "vue";

const props = defineProps<{
  lessonText: string;
  lessonLevel: string;
  typedText: string;
  stats: TrainerStats;
}>();

const emit = defineEmits<{
  "update:typedText": [value: string];
  refreshLesson: [];
}>();

const isFinished = computed(() => {
  return props.typedText.length >= props.lessonText.length;
});

const typingSurface = ref<HTMLElement | null>(null);

const lessonTokens = computed(() => {
  let characterIndex = 0;

  return props.lessonText.split(/(\s+)/).filter(Boolean).map((part, tokenIndex) => {
    const characters = part.split("").map((value) => {
      const index = characterIndex;

      characterIndex += 1;

      return {
        id: `${index}-${value}`,
        index,
        value,
      };
    });

    return {
      id: `${tokenIndex}-${part}`,
      kind: /^\s+$/.test(part) ? "space" : "word",
      characters,
    };
  });
});

const formattedTime = computed(() => {
  const minutes = Math.floor(props.stats.seconds / 60);
  const seconds = props.stats.seconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

const focusTypingSurface = () => {
  typingSurface.value?.focus();
};

const updateTypedText = (value: string) => {
  emit("update:typedText", value.slice(0, props.lessonText.length));
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    updateTypedText(props.typedText.slice(0, -1));
    return;
  }

  if (event.key === " " && props.typedText.length === 0) {
    event.preventDefault();
    return;
  }

  if (event.key.length !== 1 || props.typedText.length >= props.lessonText.length) {
    return;
  }

  event.preventDefault();
  updateTypedText(`${props.typedText}${event.key}`);
};

const handlePaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData("text") ?? "";

  if (!pastedText) {
    return;
  }

  event.preventDefault();
  updateTypedText(`${props.typedText}${props.typedText.length === 0 ? pastedText.trimStart() : pastedText}`);
};

const getCharacterState = (index: number) => {
  if (index === props.typedText.length) {
    return "current";
  }

  if (index >= props.typedText.length) {
    return "pending";
  }

  return props.typedText[index] === props.lessonText[index] ? "correct" : "wrong";
};

const getCharacterText = (index: number, expectedCharacter: string) => {
  const typedCharacter = props.typedText[index];
  const character =
    typedCharacter && typedCharacter !== expectedCharacter
      ? typedCharacter
      : expectedCharacter;

  return character === " " ? "\u00A0" : character;
};

onMounted(() => {
  nextTick(focusTypingSurface);
});

watch(
  () => props.lessonText,
  () => {
    nextTick(focusTypingSurface);
  }
);

const styles = tv({
  slots: {
    root: [
      "min-h-[560px] rounded-panel border border-slate-900/10 bg-white/80 p-6 shadow-soft backdrop-blur-xl md:p-7 flex flex-col",
    ],
    header: ["flex flex-col justify-between gap-4 md:flex-row md:items-start"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    badge: [
      "inline-flex items-center rounded-2xl border border-accent-deep bg-accent-deep/10 px-3 py-1 text-sm font-semibold text-accent-deep",
    ],
    statsGrid: ["mt-6 grid gap-3 md:grid-cols-5"],
    statCard: ["rounded-2xl border border-slate-900/10 bg-white/90 p-4"],
    statLabel: [
      "block text-xs font-semibold uppercase tracking-[0.18em] text-muted",
    ],
    statValue: ["mt-2 block text-3xl"],
    sectionBlock: ["mt-6 flex flex-col gap-3"],
    sectionHeader: ["flex items-center justify-between gap-3"],
    sectionLabel: ["block text-sm font-semibold leading-5 text-muted"],
    progressText: ["text-sm font-semibold text-muted"],
    typingCard: [
      "min-h-[300px] rounded-2xl border border-slate-900/10 bg-white/90 p-5 text-xl font-semibold leading-[1.9] text-slate-400 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition",
      "focus:border-accent-deep focus:bg-white focus:ring-4 focus:ring-accent-deep/15",
      "md:p-7 md:text-2xl",
    ],
    word: [
      "inline-block whitespace-nowrap",
    ],
    character: [
      "relative rounded-md",
    ],
    startCursorWrap: [
      "relative inline-block h-[1em] w-0",
    ],
    cursor: [
      "absolute -right-[0.06em] top-1/2 z-10 h-[1.08em] w-0.5 -translate-y-1/2 rounded-full bg-clan-teal/80",
    ],
    actionButton: [
      "rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800",
    ],
    buttonRow: ["flex justify-end"],
  },
  variants: {
    state: {
      pending: {
        character: "text-slate-400",
      },
      current: {
        character: "text-slate-400",
      },
      correct: {
        character: "text-ink",
      },
      wrong: {
        character: "bg-rose-100 text-rose-700",
      },
    },
    space: {
      true: {
        character: "inline-block w-[0.55em] whitespace-pre-wrap",
      },
    },
    position: {
      end: {
        cursor: "static inline-block translate-y-[0.08em]",
      },
    },
  },
});

const {
  root,
  header,
  kicker,
  title,
  badge,
  statsGrid,
  statCard,
  statLabel,
  statValue,
  sectionBlock,
  sectionHeader,
  sectionLabel,
  progressText,
  typingCard,
  word,
  character,
  startCursorWrap,
  cursor,
  actionButton,
  buttonRow,
} = styles();
</script>
