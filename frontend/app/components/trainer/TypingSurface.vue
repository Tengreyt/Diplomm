<template>
  <div
    ref="root"
    role="textbox"
    aria-label="Поле тренировки печати"
    :aria-multiline="true"
    :class="typingCard({
      compact: lessonText.length > 120,
      guideExpanded: isKeyboardGuideExpanded
    })"
    tabindex="0"
    @click="focus"
    @keydown="onKeydown"
    @wheel.passive="blurOnScroll"
    @paste="onPaste"
  >
    <span v-if="typedText.length === 0" :class="startCursorWrap()">
      <span :class="cursor()" aria-hidden="true" />
    </span>

    <span
      v-for="token in lessonTokens"
      :key="token.id"
      :class="word()"
    >
      <span
        v-for="char in token.characters"
        :key="char.id"
        :class="character({
          state: getCharacterState(char.index),
          space: char.value === ' '
        })"
      >
        {{ getCharacterText(char.index, char.value) }}
        <span
          v-if="char.index === typedText.length - 1"
          :class="cursor()"
          aria-hidden="true"
        />
      </span>
    </span>

    <span
      v-if="typedText.length >= lessonText.length"
      :class="cursor({ position: 'end' })"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { tv } from "tailwind-variants";

type LessonCharacter = {
  id: string;
  index: number;
  value: string;
};

type LessonToken = {
  id: string;
  characters: LessonCharacter[];
};

const props = defineProps<{
  lessonText: string;
  typedText: string;
  isKeyboardGuideExpanded: boolean;
}>();

const emit = defineEmits<{
  "update:typedText": [value: string];
}>();

const root = ref<HTMLElement | null>(null);
const { playKeySound } = useKeyboardSound();

const lessonTokens = computed<LessonToken[]>(() => {
  const words = props.lessonText.split(" ");
  let characterIndex = 0;

  return words.map((word, wordIndex) => {
    const characters: LessonCharacter[] = [];

    for (const value of word) {
      characters.push({
        id: `${characterIndex}-${value}`,
        index: characterIndex,
        value
      });
      characterIndex += 1;
    }

    if (wordIndex < words.length - 1) {
      characters.push({
        id: `${characterIndex}- `,
        index: characterIndex,
        value: " "
      });
      characterIndex += 1;
    }

    return {
      id: `${wordIndex}-${word}`,
      characters
    };
  });
});

const focus = () => root.value?.focus();
const blurOnScroll = () => root.value?.blur();

const updateTypedText = (value: string) => {
  emit("update:typedText", value.slice(0, props.lessonText.length));
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === "Backspace") {
    event.preventDefault();
    if (props.typedText.length > 0) playKeySound(event.code || "Backspace");
    updateTypedText(props.typedText.slice(0, -1));
    return;
  }

  if (event.key === " " && props.typedText.length === 0) {
    event.preventDefault();
    return;
  }

  if (event.key.length !== 1 || props.typedText.length >= props.lessonText.length) return;

  event.preventDefault();
  playKeySound(event.code || event.key);
  updateTypedText(`${props.typedText}${event.key}`);
};

const onPaste = (event: ClipboardEvent) => {
  event.preventDefault();
};

const getCharacterState = (index: number) => {
  if (index === props.typedText.length) return "current";
  if (index >= props.typedText.length) return "pending";
  return props.typedText[index] === props.lessonText[index] ? "correct" : "wrong";
};

const getCharacterText = (index: number, expectedCharacter: string) => {
  const typedCharacter = props.typedText[index];
  const character = typedCharacter && typedCharacter !== expectedCharacter
    ? typedCharacter
    : expectedCharacter;

  return character === " " ? "\u00A0" : character;
};

const styles = tv({
  slots: {
    typingCard: [
      "glass-input shrink-0 overflow-hidden rounded-2xl p-5 text-xl font-semibold leading-[1.75] text-slate-400 antialiased outline-none transition-[height,border-color,background-color,box-shadow] duration-300 ease-out",
      "focus:border-accent-deep focus:bg-white/60 focus:ring-4 focus:ring-accent-deep/15",
      "md:p-7 md:text-2xl",
    ],
    word: ["inline-block whitespace-nowrap"],
    character: ["relative inline"],
    startCursorWrap: ["relative inline-block h-[1em] w-0 align-top"],
    cursor: [
      "absolute -right-[0.06em] top-1/2 z-10 h-[1.08em] w-0.5 -translate-y-1/2 rounded-full bg-clan-teal/80",
    ],
  },
  variants: {
    guideExpanded: {
      true: { typingCard: "h-[200px] md:h-[230px]" },
      false: { typingCard: "h-[380px] md:h-[430px]" },
    },
    compact: {
      true: { typingCard: "text-lg leading-[1.55] md:text-xl" },
      false: {},
    },
    state: {
      pending: { character: "text-slate-400" },
      current: { character: "text-slate-400" },
      correct: { character: "text-ink" },
      wrong: { character: "rounded-sm bg-rose-100 text-rose-700" },
    },
    space: {
      true: {
        character: "inline-block min-w-[0.35em] text-center",
      },
      false: {},
    },
    position: {
      end: { cursor: "static inline-block translate-y-[0.08em]" },
    },
  },
});

const { typingCard, word, character, startCursorWrap, cursor } = styles();
</script>
