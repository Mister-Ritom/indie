import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { resetPasswordSchema, type ResetPasswordForm } from '@/utils/validators';

export default function ResetPasswordScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.updateUser({
      password: data.password,
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      router.replace('/(auth)/login');
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ position: 'absolute', top: spacing.xl, left: spacing.xl }}>
            <ArrowLeft size={24} color={colors.icon} />
          </TouchableOpacity>

          <View style={{ marginBottom: spacing.xl, marginTop: spacing.xxl }}>
            <Text style={{ fontFamily: typography.families.headingBold, fontSize: 32, color: colors.text }}>
              Set new password
            </Text>
            <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginTop: spacing.xs }}>
              Please enter your new password below.
            </Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New Password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color={colors.iconMuted} />}
                />
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Repeat new password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  leftIcon={<Lock size={18} color={colors.iconMuted} />}
                />
              )}
            />

            {error && (
              <View style={{ backgroundColor: colors.error + '18', borderRadius: radius.md, padding: spacing.md }}>
                <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodySmall, color: colors.error }}>
                  {error}
                </Text>
              </View>
            )}

            <Button
              label="Update password"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              fullWidth
              size="lg"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
