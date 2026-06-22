import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from "@/utils/validators";

export default function ForgotPasswordScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      data.email,
      {
        redirectTo: "me.ritom.indie://reset-password",
      },
    );
    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        {/* Keeps the success message beautifully centered on desktop */}
        <View style={{ width: "100%", maxWidth: 420, alignItems: "center" }}>
          <Text style={{ fontSize: 48 }}>📩</Text>
          <Text
            style={{
              fontFamily: typography.families.heading,
              fontSize: typography.scale.h2,
              color: colors.text,
              marginTop: spacing.lg,
              textAlign: "center",
            }}
          >
            Check your email
          </Text>
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.textSecondary,
              marginTop: spacing.sm,
              textAlign: "center",
            }}
          >
            We sent a password reset link to your inbox.
          </Text>
          <Button
            label="Back to login"
            onPress={() => router.replace("/(auth)/login")}
            variant="outline"
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main content wrapper to cleanly contain and center the form on web/desktop */}
          <View style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
            {/* Back Button - Kept relative to the card wrapper so it doesn't drift away on wide screens */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ position: "absolute", top: 0, left: 0 }}
            >
              <ArrowLeft size={24} color={colors.icon} />
            </TouchableOpacity>

            <View style={{ marginBottom: spacing.xl, marginTop: spacing.xxl }}>
              <Text
                style={{
                  fontFamily: typography.families.headingBold,
                  fontSize: 32,
                  color: colors.text,
                }}
              >
                Reset password
              </Text>
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.body,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                Enter your email and we'll send you a link to reset your
                password.
              </Text>
            </View>

            <View style={{ gap: spacing.md }}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    leftIcon={<Mail size={18} color={colors.iconMuted} />}
                  />
                )}
              />

              {error && (
                <View
                  style={{
                    backgroundColor: colors.error + "18",
                    borderRadius: radius.md,
                    padding: spacing.md,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.families.body,
                      fontSize: typography.scale.bodySmall,
                      color: colors.error,
                    }}
                  >
                    {error}
                  </Text>
                </View>
              )}

              <Button
                label="Send reset link"
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
