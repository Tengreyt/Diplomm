import { authStorageKey } from "~/constants/auth";
import type {
  ProgressResponse,
  TrainingHistoryPage,
  TrainingResult,
  TrainingResultDetails,
  TrainingResultDetailsResponse
} from "~/types/progress";

const progressTtlMs = 2 * 60 * 1000;
let progressRequest: Promise<ProgressResponse | null> | null = null;
let historyRequest: Promise<TrainingResult[]> | null = null;
const detailRequests = new Map<string, Promise<TrainingResultDetails | null>>();
let progressCacheVersion = 0;

export const useProgress = () => {
  const config = useRuntimeConfig();
  const progress = useState<ProgressResponse | null>("user-progress", () => null);
  const isProgressLoading = useState("user-progress-loading", () => false);
  const progressError = useState("user-progress-error", () => "");
  const progressFetchedAt = useState("user-progress-fetched-at", () => 0);
  const history = useState<TrainingResult[]>("training-history", () => []);
  const historyNextCursor = useState<string | null>("training-history-cursor", () => null);
  const historyFetchedAt = useState("training-history-fetched-at", () => 0);
  const isHistoryLoading = useState("training-history-loading", () => false);
  const historyError = useState("training-history-error", () => "");
  const historyDetails = useState<Record<string, TrainingResultDetails>>("training-history-details", () => ({}));
  const activeDetailId = useState<string | null>("training-history-active-detail", () => null);
  const detailError = useState("training-history-detail-error", () => "");

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

  const fetchHistory = async ({ reset = false } = {}) => {
    if (!import.meta.client) return [];
    if (
      history.value.length > 0
      && Date.now() - historyFetchedAt.value < progressTtlMs
    ) {
      return history.value;
    }
    if (historyRequest) return historyRequest;

    const token = localStorage.getItem(authStorageKey);
    if (!token) return [];

    isHistoryLoading.value = true;
    historyError.value = "";
    const requestVersion = progressCacheVersion;
    const cursor = reset ? null : historyNextCursor.value;
    const request = $fetch<TrainingHistoryPage>(`${config.public.apiBase}/progress/history`, {
      headers: { Authorization: `Bearer ${token}` },
      query: { limit: 20, cursor: cursor || undefined }
    })
      .then((response) => {
        if (requestVersion !== progressCacheVersion) return history.value;
        const existing = reset ? [] : history.value;
        const knownIds = new Set(existing.map((item) => item.id));
        history.value = [...existing, ...response.items.filter((item) => !knownIds.has(item.id))];
        historyNextCursor.value = response.nextCursor;
        historyFetchedAt.value = Date.now();
        return history.value;
      })
      .catch(() => {
        historyError.value = "Не удалось загрузить историю тренировок.";
        return history.value;
      })
      .finally(() => {
        if (historyRequest === request) historyRequest = null;
        isHistoryLoading.value = false;
      });

    historyRequest = request;
    return request;
  };

  const loadMoreHistory = () => {
    if (!historyNextCursor.value || isHistoryLoading.value) return Promise.resolve(history.value);
    historyFetchedAt.value = 0;
    return fetchHistory();
  };

  const fetchHistoryDetail = async (resultId: string) => {
    activeDetailId.value = resultId;
    detailError.value = "";
    if (historyDetails.value[resultId]) return historyDetails.value[resultId];
    if (detailRequests.has(resultId)) return detailRequests.get(resultId);
    if (!import.meta.client) return null;

    const token = localStorage.getItem(authStorageKey);
    if (!token) return null;
    const requestVersion = progressCacheVersion;
    const request = $fetch<TrainingResultDetailsResponse>(
      `${config.public.apiBase}/progress/history/${encodeURIComponent(resultId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((response) => {
        if (requestVersion === progressCacheVersion) {
          historyDetails.value = { ...historyDetails.value, [resultId]: response.result };
        }
        return response.result;
      })
      .catch(() => {
        detailError.value = "Не удалось загрузить подробности тренировки.";
        return null;
      })
      .finally(() => detailRequests.delete(resultId));

    detailRequests.set(resultId, request);
    return request;
  };

  const closeHistoryDetail = () => {
    activeDetailId.value = null;
    detailError.value = "";
  };

  const clearProgress = () => {
    progressCacheVersion += 1;
    progress.value = null;
    progressFetchedAt.value = 0;
    progressError.value = "";
    isProgressLoading.value = false;
    progressRequest = null;
    history.value = [];
    historyNextCursor.value = null;
    historyFetchedAt.value = 0;
    isHistoryLoading.value = false;
    historyError.value = "";
    historyDetails.value = {};
    activeDetailId.value = null;
    detailError.value = "";
    historyRequest = null;
    detailRequests.clear();
  };

  return {
    progress,
    isProgressLoading,
    progressError,
    fetchProgress,
    clearProgress,
    history,
    historyNextCursor,
    isHistoryLoading,
    historyError,
    historyDetails,
    activeDetailId,
    detailError,
    fetchHistory,
    loadMoreHistory,
    fetchHistoryDetail,
    closeHistoryDetail
  };
};
