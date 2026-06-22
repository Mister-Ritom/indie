import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { FeedPin, BoardWithPins } from '@/types/database';

export function useDiscoveryCarousel() {
  const { user } = useAuthStore();
  const [pins, setPins] = useState<FeedPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCarousel() {
      if (!user) return;
      setIsLoading(true);
      
      try {
        const { data: carouselIds, error: rpcError } = await supabase.rpc('get_discovery_carousel_pins', {
          viewer_id: user.id,
          page_limit: 6,
        });
        
        if (rpcError) throw rpcError;
        
        if (!carouselIds || carouselIds.length === 0) {
          setPins([]);
          setIsLoading(false);
          return;
        }

        const ids = carouselIds.map(c => c.id);

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

        // Maintain order from RPC
        const sortedPinsData = ids.map(id => pinsData.find(p => p.id === id)).filter(Boolean);

        const results = sortedPinsData.map((pin: any) => ({
          ...pin,
          likes_count: pin.likes?.length ?? 0,
          saves_count: pin.saves?.length ?? 0,
          comments_count: pin.comments?.length ?? 0,
          is_liked: pin.likes?.some((l: any) => l.user_id === user.id) ?? false,
          is_saved: pin.saves?.some((s: any) => s.user_id === user.id) ?? false,
        })) as FeedPin[];
        
        setPins(results);
      } catch (e) {
        console.error('Error fetching discovery carousel:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCarousel();
  }, [user]);

  return { pins, isLoading };
}

export function useFeaturedBoards() {
  const { user } = useAuthStore();
  const [boards, setBoards] = useState<BoardWithPins[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBoards() {
      if (!user) return;
      setIsLoading(true);
      
      try {
        const { data: boardIds, error: rpcError } = await supabase.rpc('get_featured_boards', {
          viewer_id: user.id,
          page_limit: 10,
        });

        if (rpcError) throw rpcError;

        if (!boardIds || boardIds.length === 0) {
          setBoards([]);
          setIsLoading(false);
          return;
        }

        const ids = boardIds.map(b => b.id);

        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select(`
            *,
            profile:user_id(id, username, avatar_url, full_name),
            pins(*, assets:pin_assets(*))
          `)
          .in('id', ids);

        if (boardsError) throw boardsError;

        // Maintain order from RPC
        const sortedBoardsData = ids.map(id => boardsData.find(b => b.id === id)).filter(Boolean);

        const transformedBoards = sortedBoardsData.map((b: any) => {
          const pinsCount = b.pins?.length || 0;
          return {
            ...b,
            pins_count: pinsCount,
            pins: b.pins || [],
          };
        });
        
        setBoards(transformedBoards);
      } catch (e) {
        console.error('Error fetching featured boards:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBoards();
  }, [user]);

  return { boards, isLoading };
}

const PAGE_SIZE = 20;

export function useIdeasForYou() {
  const { user } = useAuthStore();
  const [pins, setPins] = useState<FeedPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const fetchIdeas = useCallback(
    async (offset: number, replace: boolean) => {
      if (!user) return;
      
      try {
        const { data: ideaIds, error: rpcError } = await supabase.rpc('get_discovery_ideas_pins', {
          viewer_id: user.id,
          page_limit: PAGE_SIZE,
          page_offset: offset,
        });

        if (rpcError) throw rpcError;

        if (!ideaIds || ideaIds.length === 0) {
          setHasMore(false);
          if (replace) setPins([]);
          return;
        }

        const ids = ideaIds.map(i => i.id);

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
        setHasMore(ideaIds.length === PAGE_SIZE);
        offsetRef.current = offset + ideaIds.length;
      } catch (e) {
        console.error('Error fetching discovery ideas:', e);
      }
    },
    [user]
  );

  useEffect(() => {
    setIsLoading(true);
    offsetRef.current = 0;
    fetchIdeas(0, true).finally(() => setIsLoading(false));
  }, [fetchIdeas]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    offsetRef.current = 0;
    await fetchIdeas(0, true);
    setIsRefreshing(false);
  }, [fetchIdeas]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchIdeas(offsetRef.current, false);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, fetchIdeas]);

  return { pins, isLoading, isRefreshing, isLoadingMore, hasMore, refresh, loadMore };
}
