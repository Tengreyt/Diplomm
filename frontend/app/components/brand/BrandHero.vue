<script setup lang="ts">
import { sectionKicker, sectionTitle } from "~/utils/ui";
</script>

<template>
  <section class="py-3 pb-7 md:pb-9">
    <p :class="sectionKicker()">Typing Arena for CIS</p>
    <h1 :class="[sectionTitle(), 'mt-3 max-w-4xl text-4xl leading-none md:text-6xl lg:text-7xl']">
      Клавиатурный тренажер с профилями, кланами и личным прогрессом
    </h1>
    <p class="mt-5 max-w-3xl text-base leading-7 text-muted md:text-lg">
      Идея простая: входишь под своим ником, выбираешь эмоджи-клан один раз и
      навсегда, ставишь аватар и попадаешь в собственное пространство для
      тренировок и будущих клановых соревнований.
    </p>
  </section>
</template>
