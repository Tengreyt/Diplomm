<template>
  <BaseButton
    :type="type ?? 'button'"
    :variant="variant ?? 'ghost'"
    :size="size ?? 'sm'"
    v-bind="$attrs"
    @click="emit('click', $event)"
  >
    <slot>Назад</slot>
  </BaseButton>
</template>

<script setup lang="ts">
import BaseButton from "~/components/ui/BaseButton.vue";

defineOptions({
  inheritAttrs: false
});

defineProps<{
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg";
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>
