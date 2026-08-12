import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { Platform } from 'react-native';

export default function Index() {
  const { session, profile, isLoading } = useAuthStore();
  const [trackingResolved, setTrackingResolved] = useState(false);

  useEffect(() => {
    async function resolveTracking() {
      if (Platform.OS === 'ios') {
        const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
        if (status === 'undetermined') {
          // Show the system ATT dialog directly — no custom pre-prompt
          await TrackingTransparency.requestTrackingPermissionsAsync();
        }
      }
      setTrackingResolved(true);
    }
    resolveTracking();
  }, []);

  if (isLoading || !trackingResolved) return null;

  if (session && profile) {
    if (!profile.onboarding_completed) {
      return <Redirect href="/(onboarding)/interests" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
