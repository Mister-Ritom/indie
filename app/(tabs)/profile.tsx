import React from 'react';
import { View, ActivityIndicator } from 'react-native';
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={showSidebar ? ['top', 'bottom'] : ['top']}>
      <ProfileView userId={user.id} isCurrentUser={true} />
    </SafeAreaView>
  );
}
