import type {
  ClanMember,
  ClanRatingItem,
  ClanRatingResponse,
  ClanResponse
} from "~/types/auth";

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const clanMembersTtlMs = 5 * 60 * 1000;
const clanRatingTtlMs = 2 * 60 * 1000;
const clanMemberRequests = new Map<string, Promise<ClanMember[]>>();
let clanRatingRequest: Promise<ClanRatingItem[]> | null = null;
let clanCacheVersion = 0;

const isFresh = (fetchedAt: number, ttlMs: number) => Date.now() - fetchedAt < ttlMs;

export const useClanData = () => {
  const config = useRuntimeConfig();
  const clanMembersCache = useState<Record<string, CacheEntry<ClanMember[]>>>(
    "clan-members-cache",
    () => ({})
  );
  const clanRatingCache = useState<CacheEntry<ClanRatingItem[]> | null>(
    "clan-rating-cache",
    () => null
  );

  const fetchClanMembers = async (emoji: string, force = false) => {
    const cached = clanMembersCache.value[emoji];
    if (!force && cached && isFresh(cached.fetchedAt, clanMembersTtlMs)) {
      return cached.data;
    }

    const pendingRequest = clanMemberRequests.get(emoji);
    if (pendingRequest) return pendingRequest;

    const requestVersion = clanCacheVersion;
    const request = $fetch<ClanResponse>(
      `${config.public.apiBase}/clans/${encodeURIComponent(emoji)}`
    )
      .then((response) => {
        if (requestVersion === clanCacheVersion) {
          clanMembersCache.value = {
            ...clanMembersCache.value,
            [emoji]: {
              data: response.members,
              fetchedAt: Date.now()
            }
          };
        }
        return response.members;
      })
      .catch((error) => {
        if (cached) return cached.data;
        throw error;
      })
      .finally(() => {
        if (clanMemberRequests.get(emoji) === request) {
          clanMemberRequests.delete(emoji);
        }
      });

    clanMemberRequests.set(emoji, request);
    return request;
  };

  const fetchClanRating = async (force = false) => {
    const cached = clanRatingCache.value;
    if (!force && cached && isFresh(cached.fetchedAt, clanRatingTtlMs)) {
      return cached.data;
    }

    if (clanRatingRequest) return clanRatingRequest;

    const requestVersion = clanCacheVersion;
    const request = $fetch<ClanRatingResponse>(`${config.public.apiBase}/clans`)
      .then((response) => {
        if (requestVersion === clanCacheVersion) {
          clanRatingCache.value = {
            data: response.clans,
            fetchedAt: Date.now()
          };
        }
        return response.clans;
      })
      .catch((error) => {
        if (cached) return cached.data;
        throw error;
      })
      .finally(() => {
        if (clanRatingRequest === request) {
          clanRatingRequest = null;
        }
      });

    clanRatingRequest = request;
    return request;
  };

  const invalidateClanData = (emoji?: string) => {
    clanCacheVersion += 1;
    if (emoji) {
      clanMemberRequests.delete(emoji);
      const nextCache = { ...clanMembersCache.value };
      delete nextCache[emoji];
      clanMembersCache.value = nextCache;
    } else {
      clanMemberRequests.clear();
      clanMembersCache.value = {};
    }
    clanRatingRequest = null;
    clanRatingCache.value = null;
  };

  const clearClanData = () => {
    clanCacheVersion += 1;
    clanMembersCache.value = {};
    clanRatingCache.value = null;
    clanMemberRequests.clear();
    clanRatingRequest = null;
  };

  return {
    fetchClanMembers,
    fetchClanRating,
    invalidateClanData,
    clearClanData
  };
};
