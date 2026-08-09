import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { session, profile, isLoading } = useAuthStore();
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);

  useEffect(() => {
    async function checkTracking() {
      if (Platform.OS === 'ios') {
        const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
        if (status === 'undetermined') {
          const hasSeen = await AsyncStorage.getItem('has_seen_tracking_preprompt');
          setTrackingStatus(hasSeen === 'true' ? 'skipped' : 'undetermined');
        } else {
          setTrackingStatus(status);
        }
      } else {
        setTrackingStatus('granted');
      }
    }
    checkTracking();
  }, []);

  if (isLoading || trackingStatus === null) return null;

  if (session && profile) {
    if (!profile.onboarding_completed) {
      return <Redirect href="/(onboarding)/interests" />;
    }

    // Older users who never saw the tracking prompt will have 'undetermined' status
    if (Platform.OS === 'ios' && trackingStatus === 'undetermined') {
      return <Redirect href="/(onboarding)/tracking-pre-prompt" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
