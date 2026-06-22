import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Pin, LayoutGrid } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface CreateOptionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: any;
  typography: any;
  spacing: any;
  radius: any;
}

function CreateOption({ icon, label, onPress, colors, typography, spacing, radius }: CreateOptionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ alignItems: 'center', gap: spacing.sm }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontFamily: typography.families.bodyMedium,
          fontSize: typography.scale.bodySmall,
          color: colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function CreateMenuScreen() {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Dimmed backdrop — tap to dismiss */}
      <TouchableWithoutFeedback onPress={() => router.back()}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      </TouchableWithoutFeedback>

      {/* Bottom sheet */}
      <SafeAreaView
        edges={['bottom']}
        style={{
          backgroundColor: colors.surfaceElevated,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingTop: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.lg,
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={22} color={colors.icon} />
          </TouchableOpacity>
          <Text style={{ fontFamily: typography.families.heading, fontSize: typography.scale.bodyLarge, color: colors.text }}>
            Start creating now
          </Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Options */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xxl, paddingBottom: spacing.lg }}>
          <CreateOption
            icon={<Pin size={32} color={colors.icon} />}
            label="Pin"
            onPress={() => { router.back(); router.push('/create/pin'); }}
            colors={colors}
            typography={typography}
            spacing={spacing}
            radius={radius}
          />
          <CreateOption
            icon={<LayoutGrid size={32} color={colors.icon} />}
            label="Board"
            onPress={() => { router.back(); router.push('/create/board'); }}
            colors={colors}
            typography={typography}
            spacing={spacing}
            radius={radius}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
