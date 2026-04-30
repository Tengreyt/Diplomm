<template>
  <section :class="root()">
    <p :class="kicker()">Typing Arena for CIS</p>
    <h1 :class="title()">
      Клавиатурный тренажер с профилями, кланами и личным прогрессом
    </h1>
    <p :class="body()">
      Идея простая: входишь под своим ником, выбираешь эмоджи-клан один раз и
      навсегда, ставишь аватар и попадаешь в собственное пространство для
      тренировок и будущих клановых соревнований.
    </p>
  </section>
</template>

<script setup lang="ts">
import { tv } from "tailwind-variants";

const styles = tv({
  slots: {
    root: ["py-3 pb-7 md:pb-9"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    title: [
      "mt-3 max-w-4xl text-4xl font-semibold leading-none tracking-tight text-ink md:text-6xl lg:text-7xl",
    ],
    body: ["mt-5 max-w-3xl text-base leading-7 text-muted md:text-lg"],
  },
});

const { root, kicker, title, body } = styles();
</script>