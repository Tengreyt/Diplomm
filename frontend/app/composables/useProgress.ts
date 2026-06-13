import { authStorageKey } from "~/constants/auth";
import type { ProgressResponse } from "~/types/progress";

const progressTtlMs = 2 * 60 * 1000;
let progressRequest: Promise<ProgressResponse | null> | null = null;
let progressCacheVersion = 0;

export const useProgress = () => {
  const config = useRuntimeConfig();
  const progress = useState<ProgressResponse | null>("user-progress", () => null);
  const isProgressLoading = useState("user-progress-loading", () => false);
  const progressError = useState("user-progress-error", () => "");
  const progressFetchedAt = useState("user-progress-fetched-at", () => 0);

  const fetchProgress = async (force = false) => {
    if (!import.meta.client) return;
    if (
      progress.value
      && !force
      && Date.now() - progressFetchedAt.value < progressTtlMs
    ) {
      return progress.value;
    }

    const token = localStorage.getItem(authStorageKey);
    if (!token) {
      progress.value = null;
      return;
    }

    if (progressRequest) return progressRequest;

    isProgressLoading.value = true;
    progressError.value = "";

    const requestVersion = progressCacheVersion;
    const request = $fetch<ProgressResponse>(`${config.public.apiBase}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((response) => {
        if (requestVersion === progressCacheVersion) {
          progress.value = response;
          progressFetchedAt.value = Date.now();
        }
        return response;
      })
      .catch(() => {
        if (!progress.value) {
          progressError.value = "Не удалось загрузить историю тренировок.";
        }
        return progress.value;
      })
      .finally(() => {
        if (progressRequest === request) {
          isProgressLoading.value = false;
          progressRequest = null;
        }
      });

    progressRequest = request;
    return request;
  };

  const clearProgress = () => {
    progressCacheVersion += 1;
    progress.value = null;
    progressFetchedAt.value = 0;
    progressError.value = "";
    isProgressLoading.value = false;
    progressRequest = null;
  };

  return {
    progress,
    isProgressLoading,
    progressError,
    fetchProgress,
    clearProgress
  };
};
