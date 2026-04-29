import { authStorageKey, avatarPresets } from "~/constants/auth";
import type {
  AuthMode,
  AuthResponse,
  LoginForm,
  RegisterForm,
  UserProfile
} from "~/types/auth";

type CurrentUserResponse = {
  user: UserProfile;
};

export const useAuth = () => {
  const config = useRuntimeConfig();

  const authMode = useState<AuthMode>("auth-mode", () => "register");
  const isPending = useState("auth-pending", () => false);
  const authMessage = useState("auth-message", () => "");
  const authToken = useState("auth-token", () => "");
  const currentUser = useState<UserProfile | null>("auth-user", () => null);

  const registerForm = reactive<RegisterForm>({
    login: "",
    password: "",
    nickname: "",
    emoji: "рџ”Ґ",
    avatarUrl: avatarPresets[0]
  });

  const loginForm = reactive<LoginForm>({
    login: "",
    password: ""
  });

  const clanPitch = computed(() => {
    const emoji = registerForm.emoji || "рџ”Ґ";
    return `РљР»Р°РЅ ${emoji} РѕР±СЉРµРґРёРЅСЏРµС‚ РІСЃРµС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, РєРѕС‚РѕСЂС‹Рµ РІС‹Р±СЂР°Р»Рё СЌС‚РѕС‚ СЌРјРѕРґР¶Рё РїСЂРё СЂРµРіРёСЃС‚СЂР°С†РёРё.`;
  });

  const switchMode = (mode: AuthMode) => {
    authMode.value = mode;
    authMessage.value = "";
  };

  const selectAvatar = (avatarUrl: string) => {
    registerForm.avatarUrl = avatarUrl;
  };

  const chooseEmoji = (emoji: string) => {
    registerForm.emoji = emoji;
  };

  const applySession = (response: AuthResponse) => {
    authToken.value = response.token;
    currentUser.value = response.user;
    localStorage.setItem(authStorageKey, response.token);
  };

  const clearForms = () => {
    loginForm.password = "";
    registerForm.password = "";
  };

  const registerUser = async (onSuccess?: () => Promise<void> | void) => {
    isPending.value = true;
    authMessage.value = "";

    try {
      const response = await $fetch<AuthResponse>(
        `${config.public.apiBase}/auth/register`,
        {
          method: "POST",
          body: registerForm
        }
      );

      applySession(response);
      clearForms();
      authMessage.value = "РџСЂРѕС„РёР»СЊ СЃРѕР·РґР°РЅ. Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ РІ С‚СЂРµРЅР°Р¶РµСЂ.";
      await onSuccess?.();
    } catch (error: any) {
      authMessage.value = error?.data?.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РїСЂРѕС„РёР»СЊ.";
    } finally {
      isPending.value = false;
    }
  };

  const loginUser = async (onSuccess?: () => Promise<void> | void) => {
    isPending.value = true;
    authMessage.value = "";

    try {
      const response = await $fetch<AuthResponse>(
        `${config.public.apiBase}/auth/login`,
        {
          method: "POST",
          body: loginForm
        }
      );

      applySession(response);
      clearForms();
      authMessage.value = "РЎ РІРѕР·РІСЂР°С‰РµРЅРёРµРј. РџСЂРѕС„РёР»СЊ Р·Р°РіСЂСѓР¶РµРЅ.";
      await onSuccess?.();
    } catch (error: any) {
      authMessage.value = error?.data?.message || "РќРµ СѓРґР°Р»РѕСЃСЊ РІРѕР№С‚Рё.";
    } finally {
      isPending.value = false;
    }
  };

  const restoreSession = async (onSuccess?: () => Promise<void> | void) => {
    if (!process.client) {
      return;
    }

    const savedToken = localStorage.getItem(authStorageKey);

    if (!savedToken) {
      return;
    }

    authToken.value = savedToken;

    try {
      const response = await $fetch<CurrentUserResponse>(
        `${config.public.apiBase}/me`,
        {
          headers: {
            Authorization: `Bearer ${authToken.value}`
          }
        }
      );

      currentUser.value = response.user;
      await onSuccess?.();
    } catch {
      logout();
    }
  };

  const logout = () => {
    authToken.value = "";
    currentUser.value = null;
    authMessage.value = "";
    localStorage.removeItem(authStorageKey);
  };

  return {
    authMode,
    isPending,
    authMessage,
    authToken,
    currentUser,
    registerForm,
    loginForm,
    clanPitch,
    switchMode,
    selectAvatar,
    chooseEmoji,
    registerUser,
    loginUser,
    restoreSession,
    logout
  };
};

