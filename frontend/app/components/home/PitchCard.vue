<script setup lang="ts">
import { panel, pill, sectionTitle } from "~/utils/ui";
</script>

<template>
  <div :class="[panel(), 'p-6 md:p-7']">
    <div class="grid grid-cols-2 gap-3 justify-start">
      <span :class="[pill(), 'w-fit bg-clan-teal/10 text-clan-teal']">Clan-first</span>
      <span :class="[pill(), 'w-fit bg-clan-teal/10 text-clan-teal']">CIS-ready</span>
    </div>
    <h2 :class="[sectionTitle(), 'mt-5 text-3xl']">Что уже заложено в архитектуру</h2>
    <ul class="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-muted md:text-base">
      <li>Пользовательский профиль с логином, паролем, ником, аватаром и эмоджи-кланом.</li>
      <li>Единый вход в тренажер без отдельной админки и без сложной настройки.</li>
      <li>Фундамент под будущие клановые рейтинги, матчи и сезонные ивенты.</li>
    </ul>
  </div>
</template>
