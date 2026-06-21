import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ColorScheme } from '@/theme/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  mode: ThemeMode;
  resolvedScheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
  setResolvedScheme: (scheme: ColorScheme) => void;
  loadPersistedMode: () => Promise<void>;
}

const STORAGE_KEY = 'indie_theme_mode';

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'system',
  resolvedScheme: 'light',

  setMode: async (mode) => {
    set({ mode });
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  },

  setResolvedScheme: (scheme) => {
    set({ resolvedScheme: scheme });
  },

  loadPersistedMode: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        set({ mode: saved });
      }
    } catch {
      // Use default
    }
  },
}));
