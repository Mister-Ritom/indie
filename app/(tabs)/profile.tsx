import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuthStore } from '@/stores/authStore';
import { ProfileView } from '@/components/profile/ProfileView';

export default function CurrentUserProfileScreen() {
  const { colors } = useTheme();
  const { showSidebar } = useBreakpoint();
  const { user } = useAuthStore();

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>Profile</Text>
        <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>Log in to view your profile, manage your boards, and access your settings.</Text>
        <Button label="Log in" onPress={() => router.push('/(auth)/login')} style={{ width: '100%', marginBottom: 12 }} />
        <Button label="Sign up" variant="secondary" onPress={() => router.push('/(auth)/signup')} style={{ width: '100%' }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={showSidebar ? ['top', 'bottom'] : ['top']}>
      <ProfileView userId={user.id} isCurrentUser={true} />
    </SafeAreaView>
  );
}
