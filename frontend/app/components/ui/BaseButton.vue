<template>
  <button
    :type="type ?? 'button'"
    :class="buttonClass"
    v-bind="$attrs"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { tv } from "tailwind-variants";

defineOptions({
  inheritAttrs: false
});

const props = defineProps<{
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg";
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const styles = tv({
  base: [
    "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
    "disabled:cursor-not-allowed disabled:opacity-60"
  ],
  variants: {
    variant: {
      primary: "bg-slate-900 text-white shadow-soft hover:bg-slate-800",
      ghost: "border border-slate-900/10 bg-white/80 text-ink hover:bg-slate-100",
      danger: "bg-red-500 text-white hover:bg-red-600",
      link: "bg-transparent text-accent underline-offset-2 hover:underline"
    },
    size: {
      sm: "px-3 py-2 text-sm",
      md: "",
      lg: "px-5 py-3 text-base"
    }
  },
  defaultVariants: {
    variant: "primary",
    size: "md"
  }
});

const buttonClass = computed(() => styles({ variant: props.variant, size: props.size }));
</script>
