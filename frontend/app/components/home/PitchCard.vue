<template>
  <div :class="root()">
    <div :class="pills()">
      <span :class="pill()">Clan-first</span>
      <span :class="pill()">CIS-ready</span>
    </div>
    <h2 :class="title()">Что уже заложено в архитектуру</h2>
    <ul :class="list()">
      <li>Пользовательский профиль с логином, паролем, ником, аватаром и эмоджи-кланом.</li>
      <li>Единый вход в тренажер без отдельной админки и без сложной настройки.</li>
      <li>Фундамент под будущие клановые рейтинги, матчи и сезонные ивенты.</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";

const styles = tv({
  slots: {
    root: [
      "glass-panel rounded-panel p-6 md:p-7",
    ],
    pills: ["grid grid-cols-2 justify-start gap-3"],
    pill: [
      "inline-flex w-fit items-center rounded-full bg-clan-teal/10 px-3 py-1 text-xs font-semibold text-clan-teal",
    ],
    title: ["mt-5 text-3xl font-semibold tracking-tight text-ink"],
    list: ["mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-muted md:text-base"],
  },
});

const { root, pills, pill, title, list } = styles();
</script>
