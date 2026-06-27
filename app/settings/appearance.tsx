import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Monitor } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/themeStore';

export default function AppearanceScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { mode, setMode } = useThemeStore();

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
          Appearance
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
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Monitor size={20} color={colors.icon} />
            <Text
              style={{
                fontFamily: typography.families.bodyMedium,
                fontSize: typography.scale.bodyLarge,
                color: colors.text,
              }}
            >
              Theme
            </Text>
          </View>
          
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.background,
              borderRadius: radius.pill,
              padding: 4,
            }}
          >
            {(['light', 'system', 'dark'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: radius.pill,
                  backgroundColor: mode === m ? colors.surfaceElevated : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.bodySmall,
                    color: mode === m ? colors.primary : colors.textSecondary,
                    textTransform: 'capitalize',
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
