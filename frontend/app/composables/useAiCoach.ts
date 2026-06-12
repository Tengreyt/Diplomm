import { authStorageKey } from "~/constants/auth";
import type { AiCoach, AiCoachResponse } from "~/types/coach";

export const useAiCoach = () => {
  const config = useRuntimeConfig();
  const profileCoach = useState<AiCoach | null>("profile-ai-coach", () => null);
  const isCoachLoading = useState("profile-ai-coach-loading", () => false);

  const fetchProfileCoach = async () => {
    if (!import.meta.client || isCoachLoading.value) {
      return;
    }

    const token = localStorage.getItem(authStorageKey);

    if (!token) {
      profileCoach.value = null;
      return;
    }

    isCoachLoading.value = true;

    try {
      const response = await $fetch<AiCoachResponse>(`${config.public.apiBase}/ai/coach`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      profileCoach.value = response.coach;
    } catch {
      profileCoach.value = null;
    } finally {
      isCoachLoading.value = false;
    }
  };

  return {
    profileCoach,
    isCoachLoading,
    fetchProfileCoach,
  };
};
