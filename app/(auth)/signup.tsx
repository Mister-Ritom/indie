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
import { Mail, Lock, User, AtSign } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { signUpSchema, type SignUpForm } from "@/utils/validators";
import { usernameFromName } from "@/utils/formatters";
import LogoCard from "@/components/ui/LogoCard";

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: "", full_name: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    setError(null);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, username: data.username },
      },
    });
    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }
    // If email confirmation required, show success; else auth listener fires
    if (!authData.session) {
      setSuccess(true);
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
            if (code) await supabase.auth.exchangeCodeForSession(code);
          }
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Google sign-in failed");
    }
    setGoogleLoading(false);
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
        {/* Added wrapper for confirmation state to look centered and elegant on desktop */}
        <View style={{ width: "100%", maxWidth: 420, alignItems: "center" }}>
          <Text style={{ fontSize: 48 }}>📬</Text>
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
            We sent a confirmation link to your inbox. Click it to activate your
            account.
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
          {/* Main content wrapper constraint */}
          <View style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
            <View style={{ alignItems: "center", marginBottom: spacing.md }}>
              <LogoCard width={120} height={120} />
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.body,
                  color: colors.textSecondary,
                  marginTop: spacing.md,
                }}
              >
                Create your account
              </Text>
            </View>

            {/* Google */}
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
                Sign up with Google
              </Text>
            </TouchableOpacity>

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
                or with email
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: colors.border }}
              />
            </View>

            <View style={{ gap: spacing.md }}>
              <Controller
                control={control}
                name="full_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Full name"
                    placeholder="Jane Doe"
                    autoCapitalize="words"
                    value={value}
                    onChangeText={(v) => {
                      onChange(v);
                      setValue("username", usernameFromName(v), {
                        shouldValidate: false,
                      });
                    }}
                    onBlur={onBlur}
                    error={errors.full_name?.message}
                    leftIcon={<User size={18} color={colors.iconMuted} />}
                  />
                )}
              />
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Username"
                    placeholder="jane_doe"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.username?.message}
                    leftIcon={<AtSign size={18} color={colors.iconMuted} />}
                    hint="Only lowercase letters, numbers, underscores"
                  />
                )}
              />
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
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    secureTextEntry
                    autoComplete="new-password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    leftIcon={<Lock size={18} color={colors.iconMuted} />}
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
                label="Create account"
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                fullWidth
                size="lg"
              />
            </View>

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
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.body,
                    color: colors.primary,
                  }}
                >
                  Log in
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
                By signing up you agree to our{" "}
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
            <View style={{ height: spacing.xxxl }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
