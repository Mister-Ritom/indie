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
      if (!user) return;
      try {
        const { data: feedIds, error: rpcError } = await supabase.rpc('get_feed_pins', {
          viewer_id: user.id,
          page_limit: PAGE_SIZE,
          page_offset: offset,
        });
        if (rpcError) throw rpcError;

        if (!feedIds || feedIds.length === 0) {
          setHasMore(false);
          if (replace) setPins([]);
          return;
        }

        const ids = feedIds.map((f: any) => f.id);

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
        const sortedPinsData = ids.map(id => pinsData.find(p => p.id === id)).filter(Boolean);

        const results = sortedPinsData.map((pin: any) => ({
          ...pin,
          likes_count: pin.likes?.length ?? 0,
          saves_count: pin.saves?.length ?? 0,
          comments_count: pin.comments?.length ?? 0,
          is_liked: pin.likes?.some((l: any) => l.user_id === user.id) ?? false,
          is_saved: pin.saves?.some((s: any) => s.user_id === user.id) ?? false,
        })) as FeedPin[];

        if (replace) {
          setPins(results);
        } else {
          setPins((prev) => [...prev, ...results]);
        }
        setHasMore(feedIds.length === PAGE_SIZE);
        offsetRef.current = offset + feedIds.length;
      } catch (e: any) {
        setError(e.message ?? 'Failed to load feed');
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
