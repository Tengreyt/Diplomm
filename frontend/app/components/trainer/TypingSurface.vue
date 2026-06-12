<template>
  <div
    ref="root"
    role="textbox"
    aria-label="Поле тренировки печати"
    :aria-multiline="true"
    :class="typingCard()"
    tabindex="0"
    @click="focus"
    @keydown="onKeydown"
    @paste="onPaste"
  >
    <slot name="before-cursor" />

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
          <span v-if="char.index === typedText.length - 1" :class="cursor()" aria-hidden="true"></span>
        </span>
      </span>

      <span v-for="char in token.characters" v-else :key="char.id" :class="character({ state: getCharacterState(char.index), space: true })">
        {{ getCharacterText(char.index, char.value) }}
        <span v-if="char.index === typedText.length - 1" :class="cursor()" aria-hidden="true"></span>
      </span>
    </template>

    <span v-if="typedText.length >= lessonText.length" :class="cursor({ position: 'end' })" aria-hidden="true"></span>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { tv } from 'tailwind-variants';

const props = defineProps<{
  lessonText: string;
  typedText: string;
}>();

const emit = defineEmits<{
  'update:typedText': [value: string];
}>();

const root = ref<HTMLElement | null>(null);

const lessonTokens = computed(() => {
  let characterIndex = 0;

  return props.lessonText.split(/(\s+)/).filter(Boolean).map((part, tokenIndex) => {
    const characters = part.split('').map((value) => {
      const index = characterIndex;
      characterIndex += 1;
      return { id: `${index}-${value}`, index, value };
    });

    return { id: `${tokenIndex}-${part}`, kind: /^\s+$/.test(part) ? 'space' : 'word', characters };
  });
});

const focus = () => root.value?.focus();

const updateTypedText = (value: string) => emit('update:typedText', value.slice(0, props.lessonText.length));

const onKeydown = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === 'Backspace') {
    event.preventDefault();
    updateTypedText(props.typedText.slice(0, -1));
    return;
  }

  if (event.key === ' ' && props.typedText.length === 0) {
    event.preventDefault();
    return;
  }

  if (event.key.length !== 1 || props.typedText.length >= props.lessonText.length) return;

  event.preventDefault();
  updateTypedText(`${props.typedText}${event.key}`);
};

const onPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') ?? '';
  if (!pastedText) return;
  event.preventDefault();
  updateTypedText(`${props.typedText}${props.typedText.length === 0 ? pastedText.trimStart() : pastedText}`);
};

const getCharacterState = (index: number) => {
  if (index === props.typedText.length) return 'current';
  if (index >= props.typedText.length) return 'pending';
  return props.typedText[index] === props.lessonText[index] ? 'correct' : 'wrong';
};

const getCharacterText = (index: number, expectedCharacter: string) => {
  const typedCharacter = props.typedText[index];
  const character = typedCharacter && typedCharacter !== expectedCharacter ? typedCharacter : expectedCharacter;
  return character === ' ' ? '\u00A0' : character;
};

const styles = tv({
  slots: {
    typingCard: [
      "min-h-[300px] rounded-2xl border border-slate-900/10 bg-white/90 p-5 text-xl font-semibold leading-[1.9] text-slate-400 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition",
      "focus:border-accent-deep focus:bg-white focus:ring-4 focus:ring-accent-deep/15",
      "md:p-7 md:text-2xl",
    ],
    word: ["inline-block whitespace-nowrap"],
    character: ["relative rounded-md"],
    startCursorWrap: ["relative inline-block h-[1em] w-0"],
    cursor: ["absolute -right-[0.06em] top-1/2 z-10 h-[1.08em] w-0.5 -translate-y-1/2 rounded-full bg-clan-teal/80"],
  },
  variants: {
    state: {
      pending: { character: "text-slate-400" },
      current: { character: "text-slate-400" },
      correct: { character: "text-ink" },
      wrong: { character: "bg-rose-100 text-rose-700" },
    },
    space: { true: { character: "inline-block w-[0.55em] whitespace-pre-wrap" } },
    position: { end: { cursor: "static inline-block translate-y-[0.08em]" } },
  },
});

const { typingCard, word, character, startCursorWrap, cursor } = styles();
</script>
