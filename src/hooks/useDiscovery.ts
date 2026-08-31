import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { FeedPin, BoardWithPins } from '@/types/database';

export function useDiscoveryCarousel() {
  const { user } = useAuthStore();
  const [pins, setPins] = useState<FeedPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCarousel = useCallback(async () => {
    try {
      let carouselIds: { id: string }[] = [];
      if (user) {
        const { data, error } = await supabase.rpc('get_discovery_carousel_pins', {
          viewer_id: user.id,
          page_limit: 6,
        });
        if (error) throw error;
        carouselIds = data as { id: string }[];
      } else {
        const { data, error } = await supabase
          .from('pins')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(6);
        if (error) throw error;
        carouselIds = data as { id: string }[];
      }
      
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
      
      setPins(results);
    } catch (e) {
      console.error('Error fetching discovery carousel:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCarousel();
  }, [fetchCarousel]);

  return { pins, isLoading, refresh: fetchCarousel };
}

export function useFeaturedBoards() {
  const { user } = useAuthStore();
  const [boards, setBoards] = useState<BoardWithPins[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    try {
      let boardIds: { id: string }[] = [];
      
      if (user) {
        const { data, error } = await supabase.rpc('get_featured_boards', {
          viewer_id: user.id,
          page_limit: 10,
        });
        if (error) throw error;
        boardIds = data as { id: string }[];
      } else {
        const { data, error } = await supabase
          .from('boards')
          .select('id')
          .eq('is_private', false)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        boardIds = data as { id: string }[];
      }

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
          saves(pin:pin_id(*, assets:pin_assets(*)))
        `)
        .in('id', ids);

      if (boardsError) throw boardsError;

      // Maintain order from RPC
      const sortedBoardsData = boardsData.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

      const transformedBoards = sortedBoardsData.map((b) => {
        // Each save row has shape { pin: PinObject } — unwrap
        const boardPins = ((b.saves as any[]) ?? [])
          .map((s) => s.pin)
          .filter(Boolean);
        return {
          ...b,
          profile: Array.isArray(b.profile) ? b.profile[0] : b.profile,
          pins_count: boardPins.length,
          pins: boardPins,
        } as BoardWithPins;
      });
      
      setBoards(transformedBoards);
    } catch (e) {
      console.error('Error fetching featured boards:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return { boards, isLoading, refresh: fetchBoards };
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
      try {
        let ideaIds: { id: string }[] = [];
        
        if (user) {
          const { data, error } = await supabase.rpc('get_discovery_ideas_pins', {
            viewer_id: user.id,
            page_limit: PAGE_SIZE,
            page_offset: offset,
          });
          if (error) throw error;
          ideaIds = data as { id: string }[];
        } else {
          const { data, error } = await supabase
            .from('pins')
            .select('id')
            .order('created_at', { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);
          if (error) throw error;
          ideaIds = data as { id: string }[];
        }

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
