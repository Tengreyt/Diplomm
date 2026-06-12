<template>
  <section :class="root()">
    <video
      :class="video()"
      :src="heroVideoSrc"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      aria-hidden="true"
    />

    <div :class="shade()" aria-hidden="true" />
    <div :class="cornerShade()" aria-hidden="true" />

    <div :class="content()">
      <div :class="headline()">
        <p :class="kicker()">Typing Arena</p>
        <h1 :class="title()">Клавиатурный тренажер</h1>
      </div>

      <div :class="typingPanel()" aria-label="Демонстрация набора текста">
        <div :class="windowBar()">
          <span :class="windowDot({ tone: 'red' })" />
          <span :class="windowDot({ tone: 'yellow' })" />
          <span :class="windowDot({ tone: 'green' })" />
        </div>

        <div :class="typingLines()">
          <span :class="typingLine({ line: 'first' })">Сегодня мы тренируем ровный ритм печати</span>
          <span :class="typingLine({ line: 'second' })">каждый точный символ держит скорость</span>
          <span :class="typingLine({ line: 'third' })">тренируемся вместе с другими</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/auth" :class="enterButton()">
      <LogIn class="h-5 w-5" aria-hidden="true" />
      <span>Войти</span>
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
import { LogIn } from "@lucide/vue";
import { tv } from "tailwind-variants";

const heroVideoSrc = "/videos/typing-hero.mp4";

const styles = tv({
  slots: {
    root: [
      "relative isolate flex min-h-[calc(100svh-2rem)] overflow-hidden rounded-[34px] p-4 md:p-8",
      "border border-white/10 bg-slate-950 shadow-2xl shadow-slate-950/25",
    ],
    video: ["absolute inset-0 h-full w-full object-cover"],
    shade: [
      "absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.46)_0%,rgba(2,6,23,0.2)_42%,rgba(2,6,23,0.82)_100%)]",
    ],
    cornerShade: [
      "absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.88),transparent_34%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.8),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(2,6,23,0.92),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(2,6,23,0.9),transparent_34%)]",
    ],
    content: [
      "relative z-10 mx-auto flex h-full min-h-[calc(100svh-6rem)] w-full max-w-6xl flex-col items-center justify-center gap-8 pb-20 text-center text-white md:min-h-[calc(100svh-8rem)] md:gap-10 md:pb-24",
    ],
    headline: ["flex flex-col items-center"],
    kicker: ["text-xs font-bold uppercase tracking-[0.34em] text-teal-200/85"],
    title: [
      "mt-4 max-w-5xl text-balance text-4xl font-semibold leading-[1.04] text-white md:text-6xl lg:text-7xl",
    ],
    typingPanel: [
      "w-full max-w-4xl overflow-hidden rounded-[26px] border border-white/18 bg-slate-950/72 text-left shadow-2xl shadow-black/30 backdrop-blur-md",
    ],
    windowBar: ["flex h-11 items-center gap-2 border-b border-white/10 px-5"],
    windowDot: ["h-3 w-3 rounded-full"],
    typingLines: ["grid gap-4 px-5 py-6 font-mono text-base text-slate-100 md:px-8 md:py-7 md:text-2xl"],
    typingLine: [
      "block w-fit max-w-full overflow-hidden whitespace-nowrap border-r-2 border-teal-200 pr-1",
    ],
    enterButton: [
      "absolute bottom-8 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2",
      "rounded-full border border-white/20 bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-2xl shadow-black/25 transition",
      "hover:-translate-x-1/2 hover:-translate-y-0.5 hover:bg-teal-100",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
    ],
  },
  variants: {
    tone: {
      red: {
        windowDot: "bg-red-400",
      },
      yellow: {
        windowDot: "bg-amber-300",
      },
      green: {
        windowDot: "bg-emerald-400",
      },
    },
    line: {
      first: {
        typingLine: "typing-line-first",
      },
      second: {
        typingLine: "typing-line-second text-slate-300",
      },
      third: {
        typingLine: "typing-line-third text-teal-200",
      },
    },
  },
});

const {
  root,
  video,
  shade,
  cornerShade,
  content,
  headline,
  kicker,
  title,
  typingPanel,
  windowBar,
  windowDot,
  typingLines,
  typingLine,
  enterButton,
} = styles();
</script>

<style scoped>
.typing-line-first {
  animation: typing-first 9s steps(42, end) infinite, caret 0.9s step-end infinite;
}

.typing-line-second {
  animation: typing-second 9s steps(38, end) infinite, caret 0.9s step-end infinite;
}

.typing-line-third {
  animation: typing-third 9s steps(29, end) infinite, caret 0.9s step-end infinite;
}

@keyframes typing-first {
  0%,
  6% {
    width: 0;
  }
  30%,
  100% {
    width: 100%;
  }
}

@keyframes typing-second {
  0%,
  32% {
    width: 0;
  }
  56%,
  100% {
    width: 100%;
  }
}

@keyframes typing-third {
  0%,
  58% {
    width: 0;
  }
  80%,
  100% {
    width: 100%;
  }
}

@keyframes caret {
  50% {
    border-color: transparent;
  }
}
</style>
