import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function TermsScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.xl }}>
      <Text style={{ fontFamily: typography.families.headingBold, fontSize: 32, color: colors.text, marginBottom: spacing.lg }}>
        Terms of Service
      </Text>
      
      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        1. Acceptance of Terms
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        By accessing and using Indie, you accept and agree to be bound by the terms and provision of this agreement.
      </Text>
      
      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        2. User Content
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        You retain all of your ownership rights in your content, but you are required to grant us a limited license to use, store, and display that content.
      </Text>

      {/* Placeholder for real terms */}
      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        3. Prohibited Conduct
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        You agree not to engage in any of the following prohibited activities: copying, distributing, or disclosing any part of the service in any medium.
      </Text>
    </ScrollView>
  );
}
