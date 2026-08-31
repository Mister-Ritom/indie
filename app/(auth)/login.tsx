import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as AppleAuthentication from 'expo-apple-authentication';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { loginSchema, type LoginForm } from "@/utils/validators";
import LogoCard from "@/components/ui/LogoCard";
import GoogleIcon from "@/components/ui/GoogleIcon";

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
    defaultValues: {
      email: "",
      password: "",
    },
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
          path: "auth/callback",
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

  const handleAppleSignIn = async () => {
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const { error: oauthError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (oauthError) throw oauthError;
      } else {
        throw new Error('No identityToken.');
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setError(e.message ?? 'Apple sign-in failed');
      }
    }
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
          {/* This wrapper keeps the form contained and centered on desktop/iPad */}
          <View style={{ width: "100%", maxWidth: 540, alignSelf: "center" }}>
            <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
              <LogoCard width={120} height={120} />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  marginTop: spacing.sm,
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.families.body,
                    fontSize: typography.scale.caption,
                    color: colors.textTertiary,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  by
                </Text>
                <Text
                  style={{
                    fontFamily: typography.families.headingBold,
                    fontSize: typography.scale.body,
                    color: colors.text,
                    letterSpacing: 0.5,
                  }}
                >
                  Ritom
                </Text>
              </View>
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
              <GoogleIcon size={22} />
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

            {/* Apple Sign In */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={handleAppleSignIn}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.sm,
                  backgroundColor: '#000',
                  borderRadius: radius.pill,
                  paddingVertical: 14,
                  marginBottom: spacing.md,
                }}
              >
                <Text style={{ fontSize: 22, color: '#FFF', marginBottom: 2 }}></Text>
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.body,
                    color: '#FFF',
                  }}
                >
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            )}

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

            {/* Continue as Guest */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: spacing.lg,
              }}
            >
              <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.body,
                    color: colors.textSecondary,
                  }}
                >
                  Continue as guest
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
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.caption,
                  color: colors.textTertiary,
                }}
              >
                By signing in you agree to our{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/legal/terms")}>
                <Text
                  style={{
                    fontFamily: typography.families.body,
                    fontSize: typography.scale.caption,
                    color: colors.textTertiary,
                    textDecorationLine: "underline",
                  }}
                >
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.caption,
                  color: colors.textTertiary,
                }}
              >
                {" "}
                and{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/legal/privacy")}>
                <Text
                  style={{
                    fontFamily: typography.families.body,
                    fontSize: typography.scale.caption,
                    color: colors.textTertiary,
                    textDecorationLine: "underline",
                  }}
                >
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
