import { useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import type { Notification } from "@/types/database";

export function useNotifications() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    setNotifications,
    setUnreadCount,
    setIsLoading,
  } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        id,
        type,
        read,
        created_at,
        actor:actor_id(id, username, avatar_url),
        pin:pin_id(id, title, dominant_color, pin_assets(url, variant))
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    const formattedNotifications = (data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      read: row.read,
      created_at: row.created_at,
      actor: row.actor,
      pin: row.pin
        ? {
            id: row.pin.id,
            title: row.pin.title,
            dominant_color: row.pin.dominant_color,
            thumb_url:
              (
                row.pin.pin_assets as { url: string; variant: string }[] | null
              )?.find((a) => a.variant === "thumb")?.url ?? undefined,
          }
        : undefined,
    }));

    setNotifications(formattedNotifications);
    setUnreadCount(formattedNotifications.filter((n) => !n.read).length);
  }, [user, setNotifications, setUnreadCount]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      // Optimistic update
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        ),
      );
      setUnreadCount(Math.max(0, unreadCount - 1));

      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);
    },
    [user, notifications, unreadCount, setNotifications, setUnreadCount],
  );

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

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, setIsLoading]);

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh: fetchNotifications,
    markAsRead,
  };
}
