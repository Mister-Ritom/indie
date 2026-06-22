import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { loginSchema, type LoginForm } from "@/utils/validators";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (authError) {
      setError(authError.message);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      if (Platform.OS === "web") {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
      } else {
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: "me.ritom.indie",
        });

        const { data, error: oauthError } = await supabase.auth.signInWithOAuth(
          {
            provider: "google",
            options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
          },
        );
        if (oauthError) throw oauthError;
        if (data.url) {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl,
          );
          if (result.type === "success") {
            const url = new URL(result.url);
            const code = url.searchParams.get("code");
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
            }
          }
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Google sign-in failed");
    }
    setGoogleLoading(false);
  };
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
          {/* This wrapper keeps the form contained and centered on desktop */}
          <View style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
            {/* Logo */}
            <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
              <Text
                style={{
                  fontFamily: typography.families.headingBold,
                  fontSize: 48,
                  color: colors.primary,
                }}
              >
                Indie
              </Text>
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.bodyLarge,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                Discover ideas you'll love
              </Text>
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
                borderWidth: 1.5,
                borderColor: colors.border,
                borderRadius: radius.pill,
                paddingVertical: 14,
                marginBottom: spacing.md,
                opacity: googleLoading ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 18 }}>🌐</Text>
              <Text
                style={{
                  fontFamily: typography.families.bodyMedium,
                  fontSize: typography.scale.body,
                  color: colors.text,
                }}
              >
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: colors.border }}
              />
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.caption,
                  color: colors.textSecondary,
                  marginHorizontal: spacing.sm,
                }}
              >
                or continue with email
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: colors.border }}
              />
            </View>

            {/* Email/Password */}
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
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    leftIcon={<Mail size={18} color={colors.iconMuted} />}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Your password"
                    secureTextEntry
                    autoComplete="current-password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    leftIcon={<Lock size={18} color={colors.iconMuted} />}
                  />
                )}
              />

              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
                style={{ alignSelf: "flex-end" }}
              >
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.bodySmall,
                    color: colors.primary,
                  }}
                >
                  Forgot password?
                </Text>
              </TouchableOpacity>

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
                label="Log in"
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                fullWidth
                size="lg"
              />
            </View>

            {/* Sign up link */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: spacing.xl,
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.body,
                  color: colors.textSecondary,
                }}
              >
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.body,
                    color: colors.primary,
                  }}
                >
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Legal */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: spacing.md,
                gap: 4,
              }}
            >
              <TouchableOpacity onPress={() => router.push("/legal/terms")}>
                <Text
                  style={{
                    fontFamily: typography.families.body,
                    fontSize: typography.scale.caption,
                    color: colors.textTertiary,
                  }}
                >
                  Terms
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.caption,
                  color: colors.textTertiary,
                }}
              >
                ·
              </Text>
              <TouchableOpacity onPress={() => router.push("/legal/privacy")}>
                <Text
                  style={{
                    fontFamily: typography.families.body,
                    fontSize: typography.scale.caption,
                    color: colors.textTertiary,
                  }}
                >
                  Privacy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
