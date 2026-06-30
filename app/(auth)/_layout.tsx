import React, { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const { session, profile, isLoading } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    
    const isResetPassword = segments[segments.length - 1] === "reset-password";
    
    if (session && !isResetPassword) {
      if (profile && !profile.onboarding_completed) {
        router.replace("/(onboarding)/interests");
      } else if (profile) {
        router.replace("/(tabs)");
      }
    }
  }, [session, profile, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
