import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const { session, profile, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (session) {
      if (profile && !profile.onboarding_completed) {
        router.replace("/(onboarding)/interests");
      } else if (profile) {
        router.replace("/(tabs)");
      }
    }
  }, [session, profile, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
