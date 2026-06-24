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
  }, [user]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);
    },
    [user],
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
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh: fetchNotifications,
    markAsRead,
  };
}
