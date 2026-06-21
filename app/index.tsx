import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { session, profile, isLoading } = useAuthStore();

  if (isLoading) return null;

  if (session && profile) {
    if (!profile.onboarding_completed) {
      return <Redirect href="/(onboarding)/interests" />;
    }
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}
