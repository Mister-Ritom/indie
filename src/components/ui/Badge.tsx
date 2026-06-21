import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface BadgeProps {
  count: number;
  max?: number;
}

export function Badge({ count, max = 99 }: BadgeProps) {
  const { colors, typography } = useTheme();
  if (count <= 0) return null;
  const display = count > max ? `${max}+` : String(count);

  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.badgeBg,
        borderRadius: 999,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: typography.families.bodyBold,
          fontSize: 10,
          color: colors.badgeText,
          lineHeight: 14,
        }}
      >
        {display}
      </Text>
    </View>
  );
}
