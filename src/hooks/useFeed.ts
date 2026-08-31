import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { FeedPin } from '@/types/database';

const PAGE_SIZE = 20;

export function useFeed() {
  const { user } = useAuthStore();
  const [pins, setPins] = useState<FeedPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const fetchFeed = useCallback(
    async (offset: number, replace: boolean) => {
      try {
        let feedIds: { id: string }[] = [];

        if (user) {
          // Authenticated feed based on interests
          const { data, error: rpcError } = await supabase.rpc('get_feed_pins', {
            viewer_id: user.id,
            page_limit: PAGE_SIZE,
            page_offset: offset,
          });
          if (rpcError) throw rpcError;
          feedIds = data as { id: string }[];
        } else {
          // Unauthenticated fallback: recent pins
          const { data, error: recentError } = await supabase
            .from('pins')
            .select('id')
            .order('created_at', { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);
          if (recentError) throw recentError;
          feedIds = data as { id: string }[];
        }

        if (!feedIds || feedIds.length === 0) {
          setHasMore(false);
          if (replace) setPins([]);
          return;
        }

        const ids = (feedIds as { id: string }[]).map((f) => f.id);

        const { data: pinsData, error: pinsError } = await supabase
          .from('pins')
          .select(`
            *,
            profile:user_id(id, username, avatar_url, full_name),
            assets:pin_assets(*),
            likes(user_id),
            saves(user_id),
            comments(id)
          `)
          .in('id', ids);

        if (pinsError) throw pinsError;

        // Ensure order matches the RPC's score sorting
        const sortedPinsData = pinsData.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

        const results = sortedPinsData.map((pin) => {
          const likes = pin.likes as { user_id: string }[] | null;
          const saves = pin.saves as { user_id: string }[] | null;
          const comments = pin.comments as { id: string }[] | null;

          return {
            ...pin,
            profile: Array.isArray(pin.profile) ? pin.profile[0] : pin.profile,
            assets: pin.assets || [],
            likes_count: likes?.length ?? 0,
            saves_count: saves?.length ?? 0,
            comments_count: comments?.length ?? 0,
            is_liked: user ? (likes?.some((l) => l.user_id === user.id) ?? false) : false,
            is_saved: user ? (saves?.some((s) => s.user_id === user.id) ?? false) : false,
          } as FeedPin;
        });

        if (replace) {
          setPins(results);
        } else {
          setPins((prev) => [...prev, ...results]);
        }
        setHasMore(feedIds.length === PAGE_SIZE);
        offsetRef.current = offset + feedIds.length;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load feed');
      }
    },
    [user]
  );

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    offsetRef.current = 0;
    fetchFeed(0, true).finally(() => setIsLoading(false));
  }, [fetchFeed]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    offsetRef.current = 0;
    setError(null);
    await fetchFeed(0, true);
    setIsRefreshing(false);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchFeed(offsetRef.current, false);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, fetchFeed]);

  return {
    pins,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
  };
}
