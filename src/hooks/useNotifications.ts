import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { Notification } from "@/types/database";

export function useNotifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    // Pull likes, comments, follows targeting this user
    const [likesRes, commentsRes, followsRes] = await Promise.all([
      supabase
        .from("likes")
        .select(
          "user_id, pin_id, created_at, profiles:user_id(id, username, avatar_url), pins:pin_id(id, title, dominant_color)",
        )
        .neq("user_id", user.id)
        .eq("pins.user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("comments")
        .select(
          "id, pin_id, user_id, text, created_at, profiles:user_id(id, username, avatar_url), pins:pin_id(id, title, dominant_color, user_id)",
        )
        .eq("pins.user_id", user.id)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("follows")
        .select(
          "follower_id, created_at, profiles:follower_id(id, username, avatar_url)",
        )
        .eq("following_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const allNotifications: Notification[] = [];

    (likesRes.data ?? []).forEach((row: any) => {
      if (!row.profiles || !row.pins) return;
      allNotifications.push({
        id: `like-${row.user_id}-${row.pin_id}`,
        type: "like",
        actor: row.profiles,
        pin: row.pins,
        created_at: row.created_at,
        read: false,
      });
    });

    (commentsRes.data ?? []).forEach((row: any) => {
      if (!row.profiles) return;
      allNotifications.push({
        id: `comment-${row.id}`,
        type: "comment",
        actor: row.profiles,
        pin: row.pins,
        created_at: row.created_at,
        read: false,
      });
    });

    (followsRes.data ?? []).forEach((row: any) => {
      if (!row.profiles) return;
      allNotifications.push({
        id: `follow-${row.follower_id}`,
        type: "follow",
        actor: row.profiles,
        created_at: row.created_at,
        read: false,
      });
    });

    allNotifications.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    setNotifications(allNotifications.slice(0, 50));
    setUnreadCount(allNotifications.length);
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));

    if (!user) return;
    const channelName = `notifications-${user.id}`;

    supabase
      .getChannels()
      .filter((c) => c.topic === `realtime:${channelName}`)
      .forEach((c) => {
        supabase.removeChannel(c);
      });
    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "likes" },
        () => fetchNotifications(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        () => fetchNotifications(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "follows" },
        () => fetchNotifications(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  return { notifications, unreadCount, isLoading, refresh: fetchNotifications };
}
