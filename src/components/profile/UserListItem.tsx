import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import type { Profile } from '@/types/database';

interface UserListItemProps {
  profile: Profile;
}

export function UserListItem({ profile }: UserListItemProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/user/${profile.id}`)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      <Avatar uri={profile.avatar_url} name={profile.full_name || profile.username} size="md" />
      
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: typography.scale.bodyLarge,
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {profile.full_name || `@${profile.username}`}
        </Text>
        {profile.full_name && (
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.textSecondary,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            @{profile.username}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
