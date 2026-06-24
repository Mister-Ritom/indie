import React, { useEffect } from "react";
import { Stack, useRootNavigationState, useSegments } from "expo-router";
import { View, ActivityIndicator, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initSkiaWeb } from "@/utils/skiaWebSetup";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useTheme } from "@/hooks/useTheme";

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { colors, isDark } = useTheme();
  const { isLoading, setSession, setProfile, setLoading } = useAuthStore();
  const { loadPersistedMode } = useThemeStore();

  const navigationState = useRootNavigationState();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    initSkiaWeb();
    loadPersistedMode();
  }, []);

  useEffect(() => {
    let didInit = false;

    /** Fetch profile in background — never blocks the loading gate */
    const fetchAndSetProfile = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        setProfile(profile);
      } catch {
        setProfile(null);
      }
    };

    // Handles subsequent auth events (sign-in, sign-out, token refresh).
    // Skips INITIAL_SESSION — that's handled by getSession() below to avoid racing.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === "INITIAL_SESSION") return;
      setSession(currentSession);
      if (currentSession?.user) {
        fetchAndSetProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
    });

    // Single source of truth for app boot.
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (didInit) return;
      didInit = true;
      setSession(s);

      if (s?.user) {
        // Wait for profile fetch, but timeout after 2 seconds to avoid freezing the splash screen if network hangs
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 2000),
        );
        try {
          await Promise.race([fetchAndSetProfile(s.user.id), timeoutPromise]);
        } catch (e) {
          // If it timed out, fetchAndSetProfile will still finish in the background eventually
          console.warn("Profile fetch timed out during boot");
        }
      }

      setLoading(false); // Unblock splash screen after we have both session and (hopefully) profile
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Wait until fonts are loaded, auth is checked, and the router has fully initialized
    // and matched the initial route (segments.length > 0). This prevents the router
    // from briefly showing the wrong screen while resolving the `<Redirect>`.
    if (
      fontsLoaded &&
      !isLoading &&
      navigationState?.key &&
      segments.length > 0
    ) {
      // Add a tiny delay to ensure the target screen has actually painted its first frame
      requestAnimationFrame(() => {
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 50);
      });
    }
  }, [fontsLoaded, isLoading, navigationState?.key, segments]);

  if (!fontsLoaded || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        {/* Root-level transparent modal — overlays tabs + tab bar */}
        <Stack.Screen
          name="create-menu"
          options={{
            presentation: "transparentModal",
            animation: Platform.select({
              web: "fade",
              default: "slide_from_bottom",
            }),
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="photo-editor"
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen name="pin/[id]" options={{ presentation: "card" }} />
        <Stack.Screen
          name="user/[username]"
          options={{ presentation: "card" }}
        />
        <Stack.Screen name="board/[id]" options={{ presentation: "card" }} />
        <Stack.Screen
          name="settings/index"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="settings/edit-profile"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="settings/manage-interests"
          options={{ presentation: "card" }}
        />
        <Stack.Screen name="search/users" options={{ presentation: "card" }} />
        <Stack.Screen
          name="legal/terms"
          options={{
            presentation: "card",
            headerShown: true,
            title: "Terms of Service",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="legal/privacy"
          options={{
            presentation: "card",
            headerShown: true,
            title: "Privacy Policy",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="create/pin"
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="create/board"
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootLayoutInner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
