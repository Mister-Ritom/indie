import React from "react";
import {
  View,
  Alert,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { router, usePathname } from "expo-router";
import {
  Home,
  Search,
  PlusCircle,
  Bell,
  User,
  Settings,
  LogOut,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabase/client";
import LogoCard from "../ui/LogoCard";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/(tabs)/" },
  { label: "Search", icon: Search, href: "/(tabs)/search" },
  { label: "Create", icon: PlusCircle, href: "/create-menu" },
  { label: "Notifications", icon: Bell, href: "/(tabs)/notifications" },
  { label: "Profile", icon: User, href: "/(tabs)/profile" },
];

export function WebSidebar() {
  const { colors, spacing, typography, radius } = useTheme();
  const pathname = usePathname();
  const { profile } = useAuthStore();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    const logoutLogic = async () => {
      try {
        await supabase.auth.signOut();
        router.replace("/(auth)/login");
      } catch (error) {
        console.error("Error signing out: ", error.message);
      }
    };

    // 1. Check if the app is running on the Web
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) {
        await logoutLogic();
      }
    } else {
      // 2. Use native Alert for iOS and Android
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", style: "destructive", onPress: logoutLogic },
      ]);
    }
  };

  return (
    <View
      style={{
        width: 240,
        height: "100%",
        backgroundColor: colors.sidebarBg,
        borderRightWidth: 1,
        borderRightColor: colors.sidebarBorder,
        paddingTop: Platform.OS === "web" ? 24 : 48,
        paddingHorizontal: spacing.md,
        justifyContent: "space-between",
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View
          style={{
            marginBottom: spacing.md,
            paddingHorizontal: spacing.sm,
            alignItems: "flex-start",
          }}
        >
          <LogoCard width={64} height={64} />
        </View>

        {/* Nav Items */}
        <View style={{ gap: 4 }}>
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const isActive =
              href === "/(tabs)/"
                ? pathname === "/" || pathname === "/(tabs)/"
                : pathname.startsWith(href);

            return (
              <TouchableOpacity
                key={href}
                onPress={() => router.push(href as any)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  paddingVertical: spacing.sm + 2,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: isActive
                    ? colors.overlayLight
                    : "transparent",
                  position: "relative",
                }}
                activeOpacity={0.75}
              >
                <View style={{ position: "relative" }}>
                  <Icon
                    size={22}
                    color={isActive ? colors.primary : colors.icon}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {label === "Notifications" && unreadCount > 0 && (
                    <Badge count={unreadCount} />
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: isActive
                      ? typography.families.heading
                      : typography.families.body,
                    fontSize: typography.scale.body,
                    color: isActive ? colors.primary : colors.text,
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom: profile + settings + logout */}
      <View style={{ gap: 4, paddingBottom: spacing.lg }}>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            paddingVertical: spacing.sm + 2,
            paddingHorizontal: spacing.md,
            borderRadius: radius.lg,
          }}
          activeOpacity={0.75}
        >
          <Settings size={20} color={colors.icon} strokeWidth={1.8} />
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.text,
            }}
          >
            Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            paddingVertical: spacing.sm + 2,
            paddingHorizontal: spacing.md,
            borderRadius: radius.lg,
          }}
          activeOpacity={0.75}
        >
          <LogOut size={20} color={colors.error} strokeWidth={1.8} />
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.error,
            }}
          >
            Log out
          </Text>
        </TouchableOpacity>

        {profile && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              padding: spacing.sm,
              borderRadius: radius.lg,
              marginTop: 4,
            }}
            activeOpacity={0.8}
          >
            <Avatar
              uri={profile.avatar_url}
              name={profile.full_name ?? profile.username}
              size="sm"
            />
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: typography.families.bodyMedium,
                  fontSize: typography.scale.bodySmall,
                  color: colors.text,
                }}
              >
                {profile.full_name ?? profile.username}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.caption,
                  color: colors.textSecondary,
                }}
              >
                @{profile.username}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
