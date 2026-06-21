import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface PillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function Pill({ label, active = false, onPress, icon }: PillProps) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.pillBgActive : colors.pillBg,
      }}
    >
      {icon}
      <Text
        style={{
          fontFamily: typography.families.bodyMedium,
          fontSize: typography.scale.bodySmall,
          color: active ? colors.pillTextActive : colors.pillText,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
