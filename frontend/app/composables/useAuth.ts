import { authStorageKey } from "~/constants/auth";
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
    emoji: "🔥",
    avatarUrl: ""
  });

  const loginForm = reactive<LoginForm>({
    login: "",
    password: ""
  });

  const clanPitch = computed(() => {
    const emoji = registerForm.emoji || "🔥";
    return `Клан ${emoji} объединяет всех пользователей, которые выбрали это эмоджи при регистрации.`;
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
      authMessage.value = "Профиль создан. Добро пожаловать в тренажер.";
      await onSuccess?.();
    } catch (error: any) {
      authMessage.value = error?.data?.message || "Не удалось создать профиль.";
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
      authMessage.value = "С возвращением. Профиль загружен.";
      await onSuccess?.();
    } catch (error: any) {
      authMessage.value = error?.data?.message || "Не удалось войти.";
    } finally {
      isPending.value = false;
    }
  };

  const restoreSession = async (onSuccess?: () => Promise<void> | void) => {
    if (!import.meta.client) {
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
