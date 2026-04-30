<template>
  <div :class="root()">
    <div :class="segmentGroup()">
      <button
        :class="segmentButton({ active: authMode === 'register' })"
        type="button"
        @click="emit('switchMode', 'register')"
      >
        Регистрация
      </button>
      <button
        :class="segmentButton({ active: authMode === 'login' })"
        type="button"
        @click="emit('switchMode', 'login')"
      >
        Вход
      </button>
    </div>

    <form v-if="authMode === 'register'" :class="form()" @submit.prevent="emit('register')">
      <label :class="field()">
        <span :class="label()">Логин</span>
        <input
          v-model="registerForm.login"
          type="text"
          placeholder="например, khalidtype"
          :class="inputField()"
        />
      </label>

      <label :class="field()">
        <span :class="label()">Пароль</span>
        <input
          v-model="registerForm.password"
          type="password"
          placeholder="не короче 6 символов"
          :class="inputField()"
        />
      </label>

      <label :class="field()">
        <span :class="label()">Никнейм на сайте</span>
        <input
          v-model="registerForm.nickname"
          type="text"
          placeholder="как тебя увидят в таблицах"
          :class="inputField()"
        />
      </label>

      <div :class="section()">
        <span :class="label()">Выбор эмоджи-клана</span>
        <div :class="grid4()">
          <button
            v-for="emoji in emojiSuggestions"
            :key="emoji"
            :class="emojiChip({ active: registerForm.emoji === emoji })"
            type="button"
            @click="emit('chooseEmoji', emoji)"
          >
            {{ emoji }}
          </button>
        </div>
        <input
          v-model="registerForm.emoji"
          type="text"
          maxlength="4"
          placeholder="или впиши свой эмоджи"
          :class="inputField()"
        />
        <p :class="hintText()">{{ clanPitch }}</p>
        <div :class="messageWarning()">
          Этот выбор нельзя менять после регистрации.
        </div>
      </div>

      <div :class="section()">
        <span :class="label()">Аватар</span>
        <p :class="hintText()">
          Выбери готовый вариант или вставь прямую ссылку на любую картинку.
        </p>
        <div :class="grid4()">
          <button
            v-for="avatar in avatarPresets"
            :key="avatar"
            :class="avatarTile({ active: registerForm.avatarUrl === avatar })"
            type="button"
            @click="emit('selectAvatar', avatar)"
          >
            <img :src="avatar" alt="" />
          </button>
        </div>
        <input
          v-model="registerForm.avatarUrl"
          type="url"
          placeholder="Своя аватарка: https://example.com/image.jpg"
          :class="inputField()"
        />
        <p :class="avatarHelp()">
          Подойдет ссылка, которую можно открыть в браузере: PNG, JPG, WEBP или SVG.
        </p>
      </div>

      <button :class="actionButton()" type="submit">
        {{ isPending ? 'Создаем профиль...' : 'Продолжить' }}
      </button>
    </form>

    <form v-else :class="form()" @submit.prevent="emit('login')">
      <label :class="field()">
        <span :class="label()">Логин</span>
        <input
          v-model="loginForm.login"
          type="text"
          placeholder="введи логин"
          :class="inputField()"
        />
      </label>

      <label :class="field()">
        <span :class="label()">Пароль</span>
        <input
          v-model="loginForm.password"
          type="password"
          placeholder="введи пароль"
          :class="inputField()"
        />
      </label>

      <button :class="actionButton()" type="submit">
        {{ isPending ? 'Входим...' : 'Войти' }}
      </button>
    </form>

    <p v-if="authMessage" :class="infoMessage()">{{ authMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { avatarPresets, emojiSuggestions } from "~/constants/auth";
import type { AuthMode, LoginForm, RegisterForm } from "~/types/auth";
import { tv } from "tailwind-variants";

defineProps<{
  authMode: AuthMode;
  isPending: boolean;
  authMessage: string;
  registerForm: RegisterForm;
  loginForm: LoginForm;
  clanPitch: string;
}>();

const emit = defineEmits<{
  switchMode: [mode: AuthMode];
  selectAvatar: [avatarUrl: string];
  chooseEmoji: [emoji: string];
  register: [];
  login: [];
}>();

const styles = tv({
  slots: {
    root: [
      "rounded-panel border border-slate-900/10 bg-white/90 p-6 shadow-soft backdrop-blur-xl md:p-7",
    ],
    segmentGroup: ["inline-grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/80 p-1"],
    segmentButton: ["rounded-xl px-4 py-2 text-sm font-semibold transition"],
    form: ["mt-6 grid gap-5"],
    field: ["grid gap-2"],
    label: ["text-sm font-semibold text-muted"],
    section: ["grid gap-3"],
    grid4: ["grid grid-cols-4 gap-3"],
    emojiChip: ["flex min-h-14 items-center justify-center rounded-2xl border text-2xl transition"],
    avatarTile: ["rounded-2xl border bg-white p-2 transition"],
    hintText: ["text-sm leading-6 text-muted"],
    avatarHelp: ["text-xs leading-5 text-muted"],
    inputField: [
      "w-full rounded-2xl border border-slate-300/70 bg-white/90 px-4 py-3 text-sm text-ink outline-none",
      "transition focus:border-slate-900/80 focus:ring-2 focus:ring-slate-200"
    ],
    actionButton: [
      "w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800",
      "shadow-soft"
    ],
    messageWarning: [
      "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    ],
    infoMessage: ["mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700"],
  },
  variants: {
    active: {
      true: {
        segmentButton: "bg-accent text-slate-950 shadow-sm",
        emojiChip: "border-accent bg-accent-soft shadow-sm",
        avatarTile: "border-accent bg-accent-soft shadow-sm",
      },
      false: {
        segmentButton: "text-muted hover:text-ink",
        emojiChip: "border-slate-900/10 bg-white hover:-translate-y-0.5",
        avatarTile: "border-slate-900/10 hover:-translate-y-0.5",
      },
    },
  },
  defaultVariants: {
    active: false,
  },
});

const {
  root,
  segmentGroup,
  segmentButton,
  form,
  field,
  label,
  section,
  grid4,
  emojiChip,
  avatarTile,
  hintText,
  avatarHelp,
  actionButton,
  inputField,
  messageWarning,
  infoMessage,
} = styles();
</script>
