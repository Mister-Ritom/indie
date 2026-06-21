import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function PrivacyScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.xl }}>
      <Text style={{ fontFamily: typography.families.headingBold, fontSize: 32, color: colors.text, marginBottom: spacing.lg }}>
        Privacy Policy
      </Text>
      
      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        1. Information We Collect
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        We collect information you provide directly to us, such as when you create or modify your account, or interact with the app.
      </Text>
      
      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        2. How We Use Information
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        We use the information we collect to provide, maintain, and improve our services, as well as to personalize your experience.
      </Text>
    </ScrollView>
  );
}
