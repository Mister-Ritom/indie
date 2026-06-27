import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Ban } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { confirmAction } from '@/utils/alerts';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface BlockedUser {
  blocked_id: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function BlockedUsersScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { user } = useAuthStore();
  
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingIds, setUnblockingIds] = useState<Set<string>>(new Set());

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_blocks')
      .select(`
        blocked_id,
        profiles!user_blocks_blocked_id_fkey (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // The join returns profiles as an object (since it's a many-to-one or one-to-one from the perspective of the block).
      // However, PostgREST might return an array if the foreign key is ambiguous. Let's cast assuming it's a single object.
      setBlockedUsers(data as unknown as BlockedUser[]);
    }
    
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleUnblock = (blockedId: string, username: string) => {
    if (!user) return;

    confirmAction(
      'Unblock User',
      `Are you sure you want to unblock @${username}?`,
      async () => {
        // Optimistic UI
        setUnblockingIds((prev) => {
          const next = new Set(prev);
          next.add(blockedId);
          return next;
        });

        const { error } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', blockedId);

        if (!error) {
          setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== blockedId));
        }
        
        setUnblockingIds((prev) => {
          const next = new Set(prev);
          next.delete(blockedId);
          return next;
        });
      }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: typography.families.headingMedium,
            fontSize: typography.scale.h3,
            color: colors.text,
            marginLeft: spacing.md,
          }}
        >
          Blocked Users
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        {isLoading ? (
          <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : blockedUsers.length === 0 ? (
          <View
            style={{
              paddingVertical: spacing.xxl,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
              }}
            >
              <Ban size={28} color={colors.iconMuted} />
            </View>
            <Text
              style={{
                fontFamily: typography.families.bodyMedium,
                fontSize: typography.scale.bodyLarge,
                color: colors.textSecondary,
              }}
            >
              No blocked users
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            {blockedUsers.map((item, index) => {
              const profile = item.profiles;
              if (!profile) return null;

              const isUnblocking = unblockingIds.has(item.blocked_id);

              return (
                <View
                  key={item.blocked_id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.md,
                    borderBottomWidth: index < blockedUsers.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md }}
                    onPress={() => router.push(`/user/${profile.username}`)}
                  >
                    <Avatar
                      uri={profile.avatar_url}
                      name={profile.full_name || profile.username}
                      size="sm"
                    />
                    <View style={{ flex: 1 }}>
                      {profile.full_name && (
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: typography.families.bodyMedium,
                            fontSize: typography.scale.body,
                            color: colors.text,
                          }}
                        >
                          {profile.full_name}
                        </Text>
                      )}
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: typography.families.body,
                          fontSize: profile.full_name
                            ? typography.scale.bodySmall
                            : typography.scale.body,
                          color: profile.full_name
                            ? colors.textSecondary
                            : colors.text,
                        }}
                      >
                        @{profile.username}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <Button
                    label="Unblock"
                    variant="outline"
                    size="sm"
                    disabled={isUnblocking}
                    onPress={() => handleUnblock(item.blocked_id, profile.username)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
