import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';

export default function VerifyEmailScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Text style={{ fontSize: 48 }}>📬</Text>
      <Text style={{ fontFamily: typography.families.heading, fontSize: typography.scale.h2, color: colors.text, marginTop: spacing.lg, textAlign: 'center' }}>
        Email Verified
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
        Your email has been successfully verified. You can now log in.
      </Text>
      <Button label="Go to login" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: spacing.xl }} />
    </SafeAreaView>
  );
}
