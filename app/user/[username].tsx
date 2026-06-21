import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuthStore } from '@/stores/authStore';
import { ProfileView } from '@/components/profile/ProfileView';
import { supabase } from '@/lib/supabase/client';

export default function OtherUserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { colors, spacing, typography } = useTheme();
  const { showSidebar } = useBreakpoint();
  const { user } = useAuthStore();
  
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const resolveUser = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
        
      if (isMounted) {
        if (error || !data) {
          setError('User not found');
        } else {
          setTargetUserId(data.id);
        }
        setIsLoading(false);
      }
    };
    if (username) resolveUser();
    return () => { isMounted = false; };
  }, [username]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={showSidebar ? ['top', 'bottom'] : ['top']}>
      {/* Header bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.families.headingMedium, fontSize: typography.scale.h3, color: colors.text, marginLeft: spacing.md }}>
          {username}
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !targetUserId ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodyLarge, color: colors.textSecondary }}>{error}</Text>
        </View>
      ) : (
        <ProfileView userId={targetUserId} isCurrentUser={user?.id === targetUserId} />
      )}
    </SafeAreaView>
  );
}
