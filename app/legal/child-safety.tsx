import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldAlert, CheckCircle, Mail, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function ChildSafetyPolicyScreen() {
  const { colors, spacing, typography, radius } = useTheme();

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
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: typography.families.headingMedium,
            fontSize: typography.scale.h3,
            color: colors.text,
            marginLeft: spacing.md,
            flex: 1,
          }}
          numberOfLines={1}
        >
          Child Safety Standards
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }}>
        {/* Policy Intro Card */}
        <View
          style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <ShieldAlert size={24} color={colors.error} />
            <Text
              style={{
                fontFamily: typography.families.headingBold,
                fontSize: typography.scale.bodyLarge,
                color: colors.text,
              }}
            >
              Zero-Tolerance Policy
            </Text>
          </View>
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.textSecondary,
              lineHeight: 20,
            }}
          >
            Indie is committed to providing a safe, positive, and secure environment for our community. We have absolute zero tolerance for any content or behavior that exploits, abuses, or endangers children. Any violation of these standards will result in immediate termination of access and report to law enforcement.
          </Text>
        </View>

        {/* Section 1: Prohibited Content & Conduct */}
        <Text
          style={{
            fontFamily: typography.families.headingMedium,
            fontSize: typography.scale.h3,
            color: colors.text,
            marginBottom: spacing.sm,
            marginTop: spacing.md,
          }}
        >
          1. Prohibited Content & Conduct
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            lineHeight: 20,
            marginBottom: spacing.md,
          }}
        >
          We strictly prohibit any of the following on the Indie platform:
        </Text>

        <View style={{ gap: spacing.sm, marginBottom: spacing.xl, paddingLeft: spacing.sm }}>
          {[
            "Child Sexual Abuse Material (CSAM): Visual depictions, computer-generated graphics, or descriptions of minors in sexually explicit situations.",
            "Child Sexual Abuse & Exploitation (CSAE): Behaviors and content that groom, abuse, sextort, traffic, or sexually exploit children.",
            "Predatory Behavior: Attempting to contact, solicit, or groom minors for sexual purposes or exploitation.",
            "Endangerment: Content that promotes, depicts, or facilitates harm, abuse, or self-harm of minors.",
          ].map((bullet, idx) => (
            <View key={idx} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
              <AlertTriangle size={16} color={colors.error} style={{ marginTop: 2 }} />
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.body,
                  color: colors.textSecondary,
                  flex: 1,
                  lineHeight: 20,
                }}
              >
                <Text style={{ fontFamily: typography.families.bodyMedium, color: colors.text }}>
                  {bullet.split(':')[0]}:
                </Text>
                {bullet.split(':')[1]}
              </Text>
            </View>
          ))}
        </View>

        {/* Section 2: Reporting Mechanism */}
        <Text
          style={{
            fontFamily: typography.families.headingMedium,
            fontSize: typography.scale.h3,
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          2. In-App Reporting Mechanism
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            lineHeight: 20,
            marginBottom: spacing.md,
          }}
        >
          We empower our community to act immediately if they detect any child safety issues. You can report content or accounts through the following tools:
        </Text>

        <View style={{ gap: spacing.sm, marginBottom: spacing.xl, paddingLeft: spacing.sm }}>
          {[
            "In-App Flagging: Tap the three dots option icon on any pin or profile, select 'Report', and choose the Child Safety category.",
            "Immediate Moderation: Reports containing child safety keywords are prioritized and flagged to our high-priority safety queue.",
            "Contact Form: Submit details directly through our contact support page under the Help settings panel.",
          ].map((bullet, idx) => (
            <View key={idx} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
              <CheckCircle size={16} color={colors.primary} style={{ marginTop: 2 }} />
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.body,
                  color: colors.textSecondary,
                  flex: 1,
                  lineHeight: 20,
                }}
              >
                <Text style={{ fontFamily: typography.families.bodyMedium, color: colors.text }}>
                  {bullet.split(':')[0]}:
                </Text>
                {bullet.split(':')[1]}
              </Text>
            </View>
          ))}
        </View>

        {/* Section 3: Enforcement & Action */}
        <Text
          style={{
            fontFamily: typography.families.headingMedium,
            fontSize: typography.scale.h3,
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          3. Moderation and Enforcement
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            lineHeight: 20,
            marginBottom: spacing.xl,
          }}
        >
          Indie takes immediate action upon obtaining knowledge of violations:
          {"\n\n"}
          • <Text style={{ fontFamily: typography.families.bodyMedium, color: colors.text }}>Immediate Removal</Text>: Content identified as CSAM/CSAE is deleted instantly from our database and storage.
          {"\n"}
          • <Text style={{ fontFamily: typography.families.bodyMedium, color: colors.text }}>Account Termination</Text>: Associated user accounts are permanently disabled, and device identifiers are blocked.
          {"\n"}
          • <Text style={{ fontFamily: typography.families.bodyMedium, color: colors.text }}>Legal Reporting</Text>: In accordance with the law, we report all instances of CSAM to the <Text style={{ fontFamily: typography.families.bodyMedium, color: colors.text }}>National Center for Missing & Exploited Children (NCMEC)</Text> and cooperate with global law enforcement agencies.
        </Text>

        {/* Section 4: Point of Contact */}
        <Text
          style={{
            fontFamily: typography.families.headingMedium,
            fontSize: typography.scale.h3,
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          4. Safety Point of Contact
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            lineHeight: 20,
            marginBottom: spacing.xl,
          }}
        >
          Indie has designated a point of contact responsible for policy enforcement, compliance, and cooperation with child safety organizations.
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <Mail size={24} color={colors.primary} />
          <View>
            <Text
              style={{
                fontFamily: typography.families.headingMedium,
                fontSize: typography.scale.body,
                color: colors.text,
              }}
            >
              Child Safety Point of Contact
            </Text>
            <Text
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.bodySmall,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              ritomghosh856@gmail.com
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
