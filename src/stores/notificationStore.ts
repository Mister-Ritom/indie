import { create } from 'zustand';
import type { Notification } from '@/types/database';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (unreadCount: number) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
