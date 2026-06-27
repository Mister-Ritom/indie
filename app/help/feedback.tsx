import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Smile, Frown, Meh } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Rating = 'love' | 'ok' | 'bad';

export default function SubmitFeedbackScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [rating, setRating] = useState<Rating | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!rating) {
      Alert.alert("Error", "Please select a rating option.");
      return;
    }
    if (!feedbackText.trim()) {
      Alert.alert("Error", "Please share a brief explanation.");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Feedback Submitted",
        "Thank you! Your feedback helps us build a better experience.",
        [{ text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace('/') }]
      );
    }, 1500);
  };

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
          Submit Feedback
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl }}>
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.bodyLarge,
              color: colors.textSecondary,
              lineHeight: 22,
              marginBottom: spacing.xl,
            }}
          >
            How has your experience with Indie been? We love hearing from our users and read every submission.
          </Text>

          <Text
            style={{
              fontFamily: typography.families.headingMedium,
              fontSize: typography.scale.bodyLarge,
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            How are you feeling about the app?
          </Text>

          {/* Rating Toggles */}
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
            {[
              { id: 'love' as Rating, label: 'Love it', icon: <Smile size={28} color={rating === 'love' ? colors.primary : colors.icon} /> },
              { id: 'ok' as Rating, label: 'It\'s OK', icon: <Meh size={28} color={rating === 'ok' ? colors.primary : colors.icon} /> },
              { id: 'bad' as Rating, label: 'Needs work', icon: <Frown size={28} color={rating === 'bad' ? colors.primary : colors.icon} /> },
            ].map((option) => {
              const isSelected = rating === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setRating(option.id)}
                  style={{
                    flex: 1,
                    backgroundColor: isSelected ? colors.surfaceElevated : colors.surface,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    padding: spacing.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs,
                  }}
                >
                  {option.icon}
                  <Text
                    style={{
                      fontFamily: isSelected ? typography.families.bodyMedium : typography.families.body,
                      fontSize: typography.scale.bodySmall,
                      color: isSelected ? colors.primary : colors.text,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ gap: spacing.lg, marginBottom: spacing.xl }}>
            <Input
              label="Tell us more"
              placeholder="What do you like? What can we improve?"
              multiline
              numberOfLines={6}
              style={{ height: 120, textAlignVertical: 'top' }}
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
          </View>

          <Button
            label="Submit Feedback"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
