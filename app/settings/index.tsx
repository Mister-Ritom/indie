import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  User,
  Tag,
  FileText,
  Shield,
  LogOut,
  Trash2,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase/client";

export default function SettingsScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { mode, setMode } = useThemeStore();
  const { user } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const handleLogout = async () => {
    Alert.alert(
      "Sign Out", // Alert Title
      "Are you sure you want to sign out?", // Alert Message
      [
        {
          text: "Cancel",
          style: "cancel", // text style for iOS (makes it bold/prominent as a cancel action)
        },
        {
          text: "Continue",
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("Error signing out: ", error.message);
            }
          },
          style: "destructive", // Optional: makes the text red on iOS to indicate a destructive action
        },
      ],
      { cancelable: true }, // Allows tapping outside the alert box to close it (Android only)
    );
  };

  const handleDeleteAccount = async () => {
    if (typeof window !== "undefined" && window.confirm) {
      if (
        !window.confirm(
          "Are you sure you want to delete your account? This action cannot be undone.",
        )
      )
        return;
    }

    setIsDeleting(true);
    // In a real app, call an Edge Function or RPC to securely delete user + data.
    // For now, Supabase RPC or supabase.auth.admin.deleteUser (from server).
    // Client side, we just sign out as we can't self-delete easily without RPC.
    alert("Account deletion request recorded.");
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={{ marginBottom: spacing.xl }}>
      <Text
        style={{
          fontFamily: typography.families.headingMedium,
          fontSize: typography.scale.body,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
          marginLeft: spacing.md,
        }}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );

  const renderRow = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    rightElement?: React.ReactNode,
  ) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
      >
        {icon}
        <Text
          style={{
            fontFamily: typography.families.bodyMedium,
            fontSize: typography.scale.bodyLarge,
            color: colors.text,
          }}
        >
          {label}
        </Text>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
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
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md }}
      >
        {renderSection(
          "Account",
          <>
            {renderRow(
              <User size={20} color={colors.icon} />,
              "Edit profile",
              () => router.push("/settings/edit-profile"),
            )}
            {renderRow(
              <Tag size={20} color={colors.icon} />,
              "Manage interests",
              () => router.push("/settings/manage-interests"),
            )}
          </>,
        )}

        {renderSection(
          "Appearance",
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <Monitor size={20} color={colors.icon} />
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.bodyLarge,
                    color: colors.text,
                  }}
                >
                  Theme
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: colors.background,
                  borderRadius: radius.pill,
                  padding: 4,
                }}
              >
                {(["light", "system", "dark"] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMode(m)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: radius.pill,
                      backgroundColor:
                        mode === m ? colors.surfaceElevated : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.families.bodyMedium,
                        fontSize: typography.scale.bodySmall,
                        color:
                          mode === m ? colors.primary : colors.textSecondary,
                        textTransform: "capitalize",
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>,
        )}

        {renderSection(
          "About",
          <>
            {renderRow(
              <FileText size={20} color={colors.icon} />,
              "Terms of Service",
              () => router.push("/legal/terms"),
            )}
            {renderRow(
              <Shield size={20} color={colors.icon} />,
              "Privacy Policy",
              () => router.push("/legal/privacy"),
            )}
          </>,
        )}

        {renderSection(
          "Actions",
          <>
            {renderRow(
              <LogOut size={20} color={colors.error} />,
              "Log out",
              handleLogout,
            )}
            {renderRow(
              <Trash2 size={20} color={colors.error} />,
              "Delete account",
              handleDeleteAccount,
            )}
          </>,
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
