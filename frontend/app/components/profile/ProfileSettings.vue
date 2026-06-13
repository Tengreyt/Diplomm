<template>
  <div>
    <div :class="topbar()">
      <BackButton @click="emit('back')" />
      <div>
        <p :class="kicker()">Профиль</p>
        <div :class="titleRow()">
          <h2 :class="title()">Настройки</h2>
          <Settings :class="titleIcon()" aria-hidden="true" />
        </div>
      </div>
    </div>

    <form :class="formLayout()" @submit.prevent="save">
      <label :class="field()">
        <span>Никнейм</span>
        <input
          v-model="settingsForm.nickname"
          :class="input()"
          name="nickname"
          autocomplete="nickname"
          minlength="2"
          maxlength="40"
          required
        />
      </label>

      <label :class="field()">
        <span>Аватар</span>
        <input
          v-model="settingsForm.avatarUrl"
          :class="input()"
          type="url"
          name="avatar-url"
          autocomplete="url"
          required
        />
      </label>

      <div :class="lockedRow()">
        <span>Логин и клан</span>
        <strong>@{{ user.login }} · {{ user.emoji }}</strong>
        <p>Эти поля закреплены за аккаунтом.</p>
      </div>

      <div :class="passwordBox()">
        <span :class="sectionLabel()">Смена пароля</span>
        <label :class="field()">
          <span>Текущий пароль</span>
          <input
            v-model="settingsForm.currentPassword"
            :class="input()"
            type="password"
            name="current-password"
            autocomplete="current-password"
          />
        </label>
        <label :class="field()">
          <span>Новый пароль</span>
          <input
            v-model="settingsForm.newPassword"
            :class="input()"
            type="password"
            name="new-password"
            autocomplete="new-password"
            minlength="8"
          />
        </label>
      </div>

      <p v-if="message" :class="messageBox({ error: hasError })">{{ message }}</p>
      <button :class="saveButton()" type="submit" :disabled="isPending">
        {{ isPending ? "Сохраняем..." : "Сохранить изменения" }}
      </button>
    </form>

    <section :class="dangerZone()">
      <span :class="sectionLabel()">Опасная зона</span>
      <template v-if="isDeleteOpen">
        <p>Удаление необратимо: исчезнут профиль, история, очки и сессии.</p>
        <input
          v-model="deletePassword"
          :class="input()"
          type="password"
          name="delete-current-password"
          autocomplete="current-password"
          placeholder="Пароль для подтверждения"
        />
        <div :class="dangerActions()">
          <button type="button" :class="cancelButton()" @click="isDeleteOpen = false">Отмена</button>
          <button type="button" :class="deleteButton()" :disabled="isPending" @click="removeAccount">Удалить</button>
        </div>
      </template>
      <button v-else type="button" :class="deleteButton()" @click="isDeleteOpen = true">Удалить аккаунт</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Settings } from "@lucide/vue";
import { tv } from "tailwind-variants";
import type { UserProfile } from "~/types/auth";
import BackButton from "~/components/ui/BackButton.vue";

const props = defineProps<{ user: UserProfile }>();
const emit = defineEmits<{ back: [] }>();
const { updateProfile, deleteAccount } = useAuth();
const isPending = ref(false);
const message = ref("");
const hasError = ref(false);
const isDeleteOpen = ref(false);
const deletePassword = ref("");
const settingsForm = reactive({
  nickname: props.user.nickname,
  avatarUrl: props.user.avatarUrl,
  currentPassword: "",
  newPassword: ""
});

watch(() => props.user, (user) => {
  settingsForm.nickname = user.nickname;
  settingsForm.avatarUrl = user.avatarUrl;
}, { deep: true });

const save = async () => {
  isPending.value = true;
  message.value = "";
  hasError.value = false;
  try {
    await updateProfile(settingsForm);
    settingsForm.currentPassword = "";
    settingsForm.newPassword = "";
    message.value = "Профиль обновлён.";
  } catch (error: any) {
    hasError.value = true;
    message.value = error?.data?.message || "Не удалось обновить профиль.";
  } finally {
    isPending.value = false;
  }
};

const removeAccount = async () => {
  isPending.value = true;
  message.value = "";
  try {
    await deleteAccount(deletePassword.value);
  } catch (error: any) {
    hasError.value = true;
    message.value = error?.data?.message || "Не удалось удалить аккаунт.";
  } finally {
    isPending.value = false;
  }
};

const styles = tv({
  slots: {
    topbar: ["flex items-start gap-4"],
    kicker: ["text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"],
    titleRow: ["flex items-center gap-3"],
    title: ["mt-2 text-3xl font-semibold text-ink"],
    titleIcon: ["mt-2 h-6 w-6 text-clan-teal"],
    form: ["mt-5 grid gap-4"],
    field: ["grid gap-2 text-sm font-semibold text-muted"],
    input: ["glass-input w-full rounded-2xl px-4 py-3 text-sm text-ink outline-none focus:border-clan-teal/60 focus:ring-4 focus:ring-clan-teal/10"],
    lockedRow: [
      "glass-card rounded-2xl p-4",
      "[&_span]:block [&_span]:text-xs [&_span]:font-bold [&_span]:uppercase [&_span]:tracking-[0.16em] [&_span]:text-muted",
      "[&_strong]:mt-2 [&_strong]:block [&_strong]:text-ink [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted",
    ],
    passwordBox: ["glass-card grid gap-3 rounded-2xl p-4"],
    sectionLabel: ["block text-xs font-bold uppercase tracking-[0.18em] text-muted"],
    messageBox: ["rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"],
    saveButton: ["liquid-button rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"],
    dangerZone: ["mt-5 grid gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm leading-6 text-red-800"],
    dangerActions: ["grid grid-cols-2 gap-2"],
    cancelButton: ["glass-control rounded-xl px-3 py-2 font-semibold text-ink"],
    deleteButton: ["rounded-xl bg-red-600 px-3 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"],
  },
  variants: {
    error: {
      true: { messageBox: "bg-red-50 text-red-700" },
      false: {},
    },
  },
});

const {
  topbar, kicker, titleRow, title, titleIcon, form: formLayout, field, input, lockedRow,
  passwordBox, sectionLabel, messageBox, saveButton, dangerZone, dangerActions, cancelButton, deleteButton
} = styles();
</script>
