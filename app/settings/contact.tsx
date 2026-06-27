import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, FileText, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function ContactSettingsScreen() {
  const { colors, spacing, typography, radius } = useTheme();

  const renderRow = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {icon}
        <Text
          style={{
            fontFamily: typography.families.bodyMedium,
            fontSize: typography.scale.bodyLarge,
            color: colors.text,
          }}
        >
          {label}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );

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
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
          Contact Support
        </Text>
      </View>

      <View style={{ padding: spacing.xl }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          {renderRow(
            <Mail size={20} color={colors.icon} />,
            "Email support",
            () => router.push("/help/contact")
          )}
          {renderRow(
            <FileText size={20} color={colors.icon} />,
            "Submit feedback",
            () => router.push("/help/feedback")
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
