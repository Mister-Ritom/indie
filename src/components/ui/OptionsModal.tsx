import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { useTheme } from '@/hooks/useTheme';

export interface OptionItem {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  items: OptionItem[];
}

export function OptionsModal({ visible, onClose, items }: OptionsModalProps) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <Modal visible={visible} onClose={onClose} title="Options">
      <View style={{ paddingBottom: spacing.sm }}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => {
              onClose();
              // Small delay so modal closes before next action opens
              setTimeout(item.onPress, 200);
            }}
            activeOpacity={0.7}
            style={[
              styles.row,
              {
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.sm,
                borderRadius: radius.md,
                marginBottom: index < items.length - 1 ? 2 : 0,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: item.destructive
                    ? 'rgba(220,38,38,0.10)'
                    : colors.surface,
                  borderRadius: radius.sm,
                },
              ]}
            >
              {item.icon}
            </View>
            <Text
              style={{
                fontFamily: typography.families.bodyMedium,
                fontSize: typography.scale.bodyLarge,
                color: item.destructive ? '#DC2626' : colors.text,
                flex: 1,
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
