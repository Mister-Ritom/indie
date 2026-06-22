import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import type { Profile } from "@/types/database";

interface UserSearchCardProps {
  profile: Profile;
  columnWidth: number;
}

export function UserSearchCard({ profile, columnWidth }: UserSearchCardProps) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/user/${profile.username}`)}
      style={{
        width: columnWidth,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: "center",
        marginBottom: spacing.md, // spacing matching PinCard
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Avatar
        uri={profile.avatar_url}
        name={profile.full_name || profile.username}
        size="lg"
      />
      <Text
        style={{
          fontFamily: typography.families.headingBold,
          fontSize: typography.scale.body,
          color: colors.text,
          marginTop: spacing.sm,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {profile.full_name || `@${profile.username}`}
      </Text>
      {profile.full_name && (
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.bodySmall,
            color: colors.textSecondary,
            marginTop: 2,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          @{profile.username}
        </Text>
      )}
    </TouchableOpacity>
  );
}
