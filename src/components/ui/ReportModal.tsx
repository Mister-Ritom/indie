import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Flag, CheckCircle } from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

const REASONS = [
  { key: 'spam', label: 'Spam' },
  { key: 'inappropriate', label: 'Inappropriate content' },
  { key: 'harassment', label: 'Harassment or bullying' },
  { key: 'intellectual_property', label: 'Intellectual property violation' },
  { key: 'child_safety', label: 'Child safety concern' },
  { key: 'other', label: 'Other' },
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'pin' | 'user';
  targetId: string;
}

export function ReportModal({ visible, onClose, type, targetId }: ReportModalProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const { user } = useAuthStore();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;
    setIsSubmitting(true);

    const table = type === 'pin' ? 'pin_reports' : 'user_reports';
    const payload =
      type === 'pin'
        ? { reporter_id: user.id, pin_id: targetId, reason: selectedReason, details: details.trim() || null }
        : { reporter_id: user.id, reported_id: targetId, reason: selectedReason, details: details.trim() || null };

    const { error } = await supabase.from(table).insert(payload as any);

    setIsSubmitting(false);

    if (error) {
      if (Platform.OS === 'web') {
        window.alert('Something went wrong. Please try again.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
      return;
    }

    setSubmitted(true);
    // Auto-close after a moment
    setTimeout(handleClose, 2200);
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={submitted ? undefined : `Report ${type === 'pin' ? 'Pin' : 'Profile'}`}
    >
      {submitted ? (
        /* Success state */
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(22,163,74,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={32} color="#16A34A" />
          </View>
          <Text
            style={{
              fontFamily: typography.families.headingMedium,
              fontSize: typography.scale.bodyLarge,
              color: colors.text,
              textAlign: 'center',
            }}
          >
            Report submitted
          </Text>
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.textSecondary,
              textAlign: 'center',
              maxWidth: 280,
            }}
          >
            Thank you for helping keep Indie safe. Our team will review this shortly.
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.xs }}>
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.textSecondary,
              marginBottom: spacing.sm,
            }}
          >
            Why are you reporting this?
          </Text>

          {REASONS.map((reason) => {
            const isSelected = selectedReason === reason.key;
            return (
              <TouchableOpacity
                key={reason.key}
                onPress={() => setSelectedReason(reason.key)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected
                    ? `${colors.primary}14`
                    : colors.surface,
                  marginBottom: 6,
                }}
              >
                {/* Radio circle */}
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.primary,
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: isSelected
                      ? typography.families.bodyMedium
                      : typography.families.body,
                    fontSize: typography.scale.body,
                    color: isSelected ? colors.primary : colors.text,
                    flex: 1,
                  }}
                >
                  {reason.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Additional details when "Other" is selected */}
          {selectedReason === 'other' && (
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Tell us more (optional)"
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.inputBg,
                borderRadius: radius.md,
                padding: spacing.md,
                fontFamily: typography.families.body,
                fontSize: typography.scale.body,
                color: colors.text,
                minHeight: 80,
                textAlignVertical: 'top',
                marginTop: spacing.xs,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
              }}
            />
          )}

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            activeOpacity={0.8}
            style={{
              marginTop: spacing.md,
              backgroundColor:
                !selectedReason || isSubmitting
                  ? colors.border
                  : colors.primary,
              borderRadius: radius.pill,
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Flag size={16} color="#fff" />
                <Text
                  style={{
                    fontFamily: typography.families.bodyBold,
                    fontSize: typography.scale.body,
                    color: '#fff',
                  }}
                >
                  Submit Report
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </Modal>
  );
}
