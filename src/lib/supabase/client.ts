import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config";
import type { Database } from "@/types/database";

// Platform-aware auth storage adapter
// Native: expo-secure-store (encrypted, persists across installs)
// Web:    localStorage (standard browser storage)
const authStorage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) => {
          if (typeof window === "undefined") return null;
          return Promise.resolve(window.localStorage.getItem(key));
        },
        setItem: (key: string, value: string) => {
          if (typeof window === "undefined") return;
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          if (typeof window === "undefined") return;
          window.localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) =>
          SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      flowType: "pkce",
      detectSessionInUrl: Platform.OS === "web", // true on web, false on native
    },
  },
);
