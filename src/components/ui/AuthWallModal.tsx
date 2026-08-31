import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';

interface AuthWallModalProps {
  visible: boolean;
  onClose: () => void;
  actionLabel?: string; // e.g., "save pins", "follow users"
}

export function AuthWallModal({ visible, onClose, actionLabel = "do this" }: AuthWallModalProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={{ alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: `${colors.primary}15`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <ShieldAlert size={32} color={colors.primary} />
        </View>

        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: typography.scale.h3,
            color: colors.text,
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}
        >
          Login Required
        </Text>

        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.xl,
            lineHeight: 22,
          }}
        >
          You must log in to {actionLabel}. Join Indie to unlock all features!
        </Text>

        <Button
          label="Log in"
          onPress={() => {
            onClose();
            router.push('/(auth)/login');
          }}
          fullWidth
          style={{ marginBottom: spacing.md }}
        />
        <Button
          label="Sign up"
          variant="secondary"
          onPress={() => {
            onClose();
            router.push('/(auth)/signup');
          }}
          fullWidth
        />
      </View>
    </Modal>
  );
}
