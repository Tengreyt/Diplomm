<script setup lang="ts">
import type { UserProfile } from "~/types/auth";
import { panel, pill, statCard } from "~/utils/ui";

defineProps<{
  user: UserProfile;
}>();

const emit = defineEmits<{
  logout: [];
}>();
</script>

<template>
  <aside :class="[panel(), 'p-6 md:p-7']">
    <div class="grid grid-cols-[88px_1fr] items-center gap-4">
      <img
        :src="user.avatarUrl"
        alt="avatar"
        class="h-[88px] w-[88px] rounded-[5px] object-cover"
      />
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">
          РџСЂРѕС„РёР»СЊ Р°РєС‚РёРІРµРЅ
        </p>
        <h2 class="mt-2 text-3xl font-semibold text-ink">{{ user.nickname }}</h2>
        <p class="mt-1 text-sm text-muted">@{{ user.login }}</p>
      </div>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-3">
      <div :class="statCard()">
        <span class="block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          РљР»Р°РЅ
        </span>
        <strong class="mt-2 block text-3xl">{{ user.emoji }}</strong>
      </div>
      <div :class="statCard()">
        <span class="block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          РЈС‡Р°СЃС‚РЅРёРєРѕРІ
        </span>
        <strong class="mt-2 block text-3xl">{{ user.clanMembers }}</strong>
      </div>
    </div>

    <div class="mt-4 rounded-2xl bg-clan-teal/10 p-4 text-sm leading-6 text-muted">
      <div class="mb-3">
        <span :class="[pill(), 'bg-white/80 text-clan-teal']">
          <span class="mr-2 text-lg">рџ‘Ґ</span>
          Clan lock enabled
        </span>
      </div>
      <p>
        Р­РјРѕРґР¶Рё-РєР»Р°РЅ Р·Р°РєСЂРµРїР»РµРЅ Р·Р° Р°РєРєР°СѓРЅС‚РѕРј. РќР° СЌС‚РѕР№ Р±Р°Р·Рµ РїРѕС‚РѕРј РјРѕР¶РЅРѕ СЃС‚СЂРѕРёС‚СЊ
        РјРµР¶РєР»Р°РЅРѕРІС‹Рµ С‚Р°Р±Р»РёС†С‹, РґСѓСЌР»Рё Рё СЃРµР·РѕРЅРЅС‹Рµ Р·Р°РµР·РґС‹.
      </p>
    </div>

    <button
      type="button"
      class="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-slate-900/10 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600"
      @click="emit('logout')"
    >
      Р’С‹Р№С‚Рё
    </button>
  </aside>
</template>

