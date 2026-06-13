import { authStorageKey } from "~/constants/auth";
import type { ProgressResponse } from "~/types/progress";

export const useProgress = () => {
  const config = useRuntimeConfig();
  const progress = useState<ProgressResponse | null>("user-progress", () => null);
  const isProgressLoading = useState("user-progress-loading", () => false);
  const progressError = useState("user-progress-error", () => "");

  const fetchProgress = async (force = false) => {
    if (!import.meta.client || isProgressLoading.value) return;
    if (progress.value && !force) return;

    const token = localStorage.getItem(authStorageKey);
    if (!token) {
      progress.value = null;
      return;
    }

    isProgressLoading.value = true;
    progressError.value = "";

    try {
      progress.value = await $fetch<ProgressResponse>(`${config.public.apiBase}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      progressError.value = "Не удалось загрузить историю тренировок.";
    } finally {
      isProgressLoading.value = false;
    }
  };

  const clearProgress = () => {
    progress.value = null;
    progressError.value = "";
  };

  return {
    progress,
    isProgressLoading,
    progressError,
    fetchProgress,
    clearProgress
  };
};
