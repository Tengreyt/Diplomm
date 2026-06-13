import { authStorageKey } from "~/constants/auth";
import type { AiCoach, AiCoachResponse } from "~/types/coach";

const coachTtlMs = 5 * 60 * 1000;
let coachRequest: Promise<AiCoach | null> | null = null;
let coachCacheVersion = 0;

export const useAiCoach = () => {
  const config = useRuntimeConfig();
  const profileCoach = useState<AiCoach | null>("profile-ai-coach", () => null);
  const isCoachLoading = useState("profile-ai-coach-loading", () => false);
  const coachFetchedAt = useState("profile-ai-coach-fetched-at", () => 0);

  const fetchProfileCoach = async (force = false) => {
    if (!import.meta.client) return;
    if (
      profileCoach.value
      && !force
      && Date.now() - coachFetchedAt.value < coachTtlMs
    ) {
      return profileCoach.value;
    }

    const token = localStorage.getItem(authStorageKey);

    if (!token) {
      profileCoach.value = null;
      return;
    }

    if (coachRequest) return coachRequest;

    isCoachLoading.value = true;

    const requestVersion = coachCacheVersion;
    const request = $fetch<AiCoachResponse>(`${config.public.apiBase}/ai/coach`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (requestVersion === coachCacheVersion) {
          profileCoach.value = response.coach;
          coachFetchedAt.value = Date.now();
        }
        return response.coach;
      })
      .catch(() => {
        return profileCoach.value;
      })
      .finally(() => {
        if (coachRequest === request) {
          isCoachLoading.value = false;
          coachRequest = null;
        }
      });

    coachRequest = request;
    return request;
  };

  const setProfileCoach = (coach: AiCoach | null) => {
    coachCacheVersion += 1;
    coachRequest = null;
    isCoachLoading.value = false;
    profileCoach.value = coach;
    coachFetchedAt.value = coach ? Date.now() : 0;
  };

  const clearCoach = () => {
    coachCacheVersion += 1;
    profileCoach.value = null;
    coachFetchedAt.value = 0;
    isCoachLoading.value = false;
    coachRequest = null;
  };

  return {
    profileCoach,
    isCoachLoading,
    fetchProfileCoach,
    setProfileCoach,
    clearCoach,
  };
};
