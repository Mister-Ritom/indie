import React from 'react';
import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function NotFoundScreen() {
  const { colors, typography, spacing } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background }}>
        <Text style={{ fontFamily: typography.families.headingBold, fontSize: 64, color: colors.primary }}>404</Text>
        <Text style={{ fontFamily: typography.families.headingMedium, fontSize: typography.scale.h2, color: colors.text, marginTop: spacing.sm }}>
          This screen doesn't exist.
        </Text>
        <Link href="/" style={{ marginTop: spacing.xl, paddingVertical: spacing.md }}>
          <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.bodyLarge, color: colors.primary }}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}
