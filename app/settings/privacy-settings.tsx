import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, User } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function PrivacySettingsScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [privateProfile, setPrivateProfile] = useState(false);
  const [activityVisible, setActivityVisible] = useState(true);

  const renderToggle = (value: boolean, onToggle: () => void) => (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: value ? colors.primary : colors.border,
        justifyContent: 'center',
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: colors.surface,
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
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
          Privacy Settings
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
          {/* Private Profile Row */}
          <View
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
              <Lock size={20} color={colors.icon} />
              <Text
                style={{
                  fontFamily: typography.families.bodyMedium,
                  fontSize: typography.scale.bodyLarge,
                  color: colors.text,
                }}
              >
                Private profile
              </Text>
            </View>
            {renderToggle(privateProfile, () => setPrivateProfile(!privateProfile))}
          </View>

          {/* Show Activity Status Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <User size={20} color={colors.icon} />
              <Text
                style={{
                  fontFamily: typography.families.bodyMedium,
                  fontSize: typography.scale.bodyLarge,
                  color: colors.text,
                }}
              >
                Show activity status
              </Text>
            </View>
            {renderToggle(activityVisible, () => setActivityVisible(!activityVisible))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
