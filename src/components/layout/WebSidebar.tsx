import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { router, usePathname, useLocalSearchParams } from "expo-router";
import {
  Home,
  Search,
  PlusCircle,
  Bell,
  User,
  Settings,
  LogOut,
  X,
  Heart,
  MessageCircle,
  UserPlus,
  Pin,
  LayoutGrid,
  ChevronRight,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import { useNotifications } from "@/hooks/useNotifications";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useThemeStore } from "@/stores/themeStore";
import { supabase } from "@/lib/supabase/client";
import { timeAgo } from "@/utils/formatters";
import type { Notification } from "@/types/database";
import LogoCard from "../ui/LogoCard";

const TouchableOpacityWeb = TouchableOpacity as any;

export function WebSidebar() {
  const { colors, typography, radius } = useTheme();
  const pathname = usePathname();
  const { profile } = useAuthStore();
  const { unreadCount } = useNotifications();
  const { activePanel, closePanel, togglePanel } = useSidebarStore();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Animated Width of the sidebar secondary panel
  const panelWidth = useSharedValue(0);

  useEffect(() => {
    panelWidth.value = withTiming(activePanel ? 360 : 0, {
      duration: 250,
    });
  }, [activePanel]);

  const sidebarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: 80 + panelWidth.value,
    };
  });

  const panelAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: panelWidth.value,
      opacity: withTiming(activePanel ? 1 : 0, { duration: 200 }),
    };
  });

  const handleLogout = async () => {
    const logoutLogic = async () => {
      try {
        await supabase.auth.signOut();
        router.replace("/(auth)/login");
      } catch (error: any) {
        console.error("Error signing out: ", error.message);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) {
        await logoutLogic();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", style: "destructive", onPress: logoutLogic },
      ]);
    }
  };

  const handleNavItemPress = (label: string, href: string) => {
    if (label === "Notifications") {
      togglePanel("notifications");
    } else if (label === "Search") {
      const willBeOpen = activePanel !== "search";
      togglePanel("search");
      if (willBeOpen) {
        router.push("/(tabs)/search" as any);
      }
    } else if (label === "Create") {
      togglePanel("create");
    } else {
      closePanel();
      router.push(href as any);
    }
  };

  const NAV_ITEMS = [
    { label: "Home", icon: Home, href: "/(tabs)/" },
    { label: "Search", icon: Search, href: "/(tabs)/search" },
    { label: "Create", icon: PlusCircle, href: "/create-menu" },
    { label: "Notifications", icon: Bell, href: "/(tabs)/notifications" },
    { label: "Profile", icon: User, href: "/(tabs)/profile" },
  ];

  return (
    <Animated.View
      style={[
        {
          height: "100%",
          backgroundColor: colors.sidebarBg,
          borderRightWidth: 1,
          borderRightColor: colors.sidebarBorder,
          flexDirection: "row",
          overflow: "hidden",
          zIndex: 100,
        },
        sidebarAnimatedStyle,
      ]}
    >
      {/* 1. Left narrow column (Always 80px wide) */}
      <View
        style={{
          width: 80,
          height: "100%",
          paddingTop: 24,
          paddingBottom: 24,
          alignItems: "center",
          justifyContent: "space-between",
          borderRightWidth: activePanel ? 1 : 0,
          borderRightColor: colors.border,
        }}
      >
        <View style={{ alignItems: "center", width: "100%", gap: 24 }}>
          {/* Logo */}
          <TouchableOpacity
            onPress={() => {
              closePanel();
              router.push("/(tabs)");
            }}
            activeOpacity={0.8}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.overlayLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LogoCard width={48} height={48} />
          </TouchableOpacity>

          {/* Navigation Icons */}
          <View style={{ width: "100%", alignItems: "center", gap: 12 }}>
            {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
              // Active state determination
              const isPanelActive =
                (label === "Notifications" &&
                  activePanel === "notifications") ||
                (label === "Search" && activePanel === "search") ||
                (label === "Create" && activePanel === "create");

              const isPathActive =
                !activePanel &&
                (href === "/(tabs)/"
                  ? pathname === "/" || pathname === "/(tabs)/"
                  : pathname.startsWith(href));

              const isActive = isPanelActive || isPathActive;

              return (
                <View
                  key={label}
                  style={{ position: "relative", alignItems: "center" }}
                >
                  <TouchableOpacityWeb
                    onPress={() => handleNavItemPress(label, href)}
                    onMouseEnter={() => setHoveredItem(label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: radius.lg,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isActive
                        ? colors.overlayLight
                        : "transparent",
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
                  </TouchableOpacityWeb>

                  {/* Pinterest-like Hover Tooltip */}
                  {hoveredItem === label && (
                    <View
                      style={{
                        position: "absolute",
                        left: 62,
                        top: 12,
                        backgroundColor: colors.text,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: radius.sm,
                        zIndex: 9999,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text
                        style={
                          {
                            color: colors.background,
                            fontSize: 11,
                            fontFamily: typography.families.bodyMedium,
                            whiteSpace: "nowrap",
                          } as any
                        }
                      >
                        {label}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom actions */}
        <View style={{ width: "100%", alignItems: "center", gap: 12 }}>
          {/* Settings */}
          <View style={{ position: "relative", alignItems: "center" }}>
            <TouchableOpacityWeb
              onPress={() => togglePanel("settings")}
              onMouseEnter={() => setHoveredItem("Settings")}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                width: 50,
                height: 50,
                borderRadius: radius.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  activePanel === "settings"
                    ? colors.overlayLight
                    : "transparent",
              }}
              activeOpacity={0.75}
            >
              <Settings
                size={22}
                color={
                  activePanel === "settings" ? colors.primary : colors.icon
                }
                strokeWidth={1.8}
              />
            </TouchableOpacityWeb>

            {hoveredItem === "Settings" && (
              <View
                style={{
                  position: "absolute",
                  left: 62,
                  top: 12,
                  backgroundColor: colors.text,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: radius.sm,
                  zIndex: 9999,
                }}
              >
                <Text
                  style={
                    {
                      color: colors.background,
                      fontSize: 11,
                      fontFamily: typography.families.bodyMedium,
                      whiteSpace: "nowrap",
                    } as any
                  }
                >
                  Settings
                </Text>
              </View>
            )}
          </View>

          {/* Profile / Avatar */}
          {profile && (
            <View style={{ position: "relative", alignItems: "center" }}>
              <TouchableOpacityWeb
                onPress={() => {
                  closePanel();
                  router.push("/(tabs)/profile");
                }}
                onMouseEnter={() => setHoveredItem("Profile")}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.8}
              >
                <Avatar
                  uri={profile.avatar_url}
                  name={profile.full_name ?? profile.username}
                  size="sm"
                />
              </TouchableOpacityWeb>

              {hoveredItem === "Profile" && (
                <View
                  style={{
                    position: "absolute",
                    left: 62,
                    top: 12,
                    backgroundColor: colors.text,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: radius.sm,
                    zIndex: 9999,
                  }}
                >
                  <Text
                    style={
                      {
                        color: colors.background,
                        fontSize: 11,
                        fontFamily: typography.families.bodyMedium,
                        whiteSpace: "nowrap",
                      } as any
                    }
                  >
                    @{profile.username}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* 2. Right animated panel (Slides/resizes from 0 to 360px) */}
      <Animated.View
        style={[
          {
            height: "100%",
            overflow: "hidden",
          },
          panelAnimatedStyle,
        ]}
      >
        <View style={{ width: 360, height: "100%" }}>
          {activePanel === "notifications" && (
            <NotificationsPanel onClose={closePanel} />
          )}
          {activePanel === "search" && <SearchPanel onClose={closePanel} />}
          {activePanel === "create" && <CreatePanel onClose={closePanel} />}
          {activePanel === "settings" && (
            <SettingsPanel onClose={closePanel} handleLogout={handleLogout} />
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── SUB-COMPONENTS FOR SIDEBAR PANELS ────────────────────────────────────────

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { colors, spacing, typography, radius } = useTheme();
  const { notifications, isLoading, markAsRead, refresh } = useNotifications();
  const { user } = useAuthStore();

  useEffect(() => {
    const markAllRead = async () => {
      if (!user) return;
      const unreadCount = notifications.filter((n) => !n.read).length;
      if (unreadCount === 0) return;

      try {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", user.id)
          .eq("read", false);

        refresh();
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    };

    if (!isLoading && notifications.length > 0) {
      markAllRead();
    }
  }, [isLoading, notifications, user, refresh]);

  const handlePress = (notif: Notification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    onClose();
    if (notif.type === "follow") {
      router.push(`/user/${notif.actor.username}`);
    } else if (notif.pin) {
      router.push(`/pin/${notif.pin.id}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.sidebarBg }}>
      {/* Header */}
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
        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: typography.scale.h3,
            color: colors.text,
          }}
        >
          Notifications
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: 4,
            borderRadius: radius.sm,
          }}
        >
          <X size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
        >
          {notifications.length === 0 ? (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.body,
                  color: colors.textSecondary,
                }}
              >
                No notifications yet.
              </Text>
            </View>
          ) : (
            notifications.map((notif) => {
              let icon, text;
              if (notif.type === "like") {
                icon = (
                  <Heart
                    size={12}
                    color={colors.primary}
                    fill={colors.primary}
                  />
                );
                text = (
                  <Text>
                    <Text style={{ fontFamily: typography.families.bodyBold }}>
                      {notif.actor.username}
                    </Text>{" "}
                    liked your pin.
                  </Text>
                );
              } else if (notif.type === "comment") {
                icon = (
                  <MessageCircle
                    size={12}
                    color={colors.success}
                    fill={colors.success}
                  />
                );
                text = (
                  <Text>
                    <Text style={{ fontFamily: typography.families.bodyBold }}>
                      {notif.actor.username}
                    </Text>{" "}
                    commented on your pin.
                  </Text>
                );
              } else {
                icon = <UserPlus size={12} color={colors.warning} />;
                text = (
                  <Text>
                    <Text style={{ fontFamily: typography.families.bodyBold }}>
                      {notif.actor.username}
                    </Text>{" "}
                    followed you.
                  </Text>
                );
              }

              return (
                <TouchableOpacity
                  key={notif.id}
                  onPress={() => handlePress(notif)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: notif.read
                      ? "transparent"
                      : colors.overlayLight,
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ position: "relative" }}>
                    <Avatar
                      uri={notif.actor.avatar_url}
                      name={notif.actor.username}
                      size="sm"
                    />
                    <View
                      style={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        backgroundColor: colors.sidebarBg,
                        borderRadius: 8,
                        padding: 1,
                      }}
                    >
                      {icon}
                    </View>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      marginLeft: spacing.sm,
                      marginRight: spacing.sm,
                    }}
                  >
                    <Text
                      numberOfLines={2}
                      style={{
                        fontFamily: typography.families.body,
                        fontSize: typography.scale.bodySmall,
                        color: colors.text,
                      }}
                    >
                      {text}
                    </Text>
                    <Text
                      style={{
                        fontFamily: typography.families.body,
                        fontSize: typography.scale.tiny,
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {timeAgo(notif.created_at)}
                    </Text>
                  </View>

                  {notif.pin && (
                    <View
                      style={{
                        width: 36,
                        height: 48,
                        borderRadius: radius.xs,
                        overflow: "hidden",
                        backgroundColor:
                          notif.pin.dominant_color ?? colors.skeleton,
                      }}
                    >
                      {notif.pin.thumb_url && (
                        <Image
                          source={{ uri: notif.pin.thumb_url }}
                          style={{ flex: 1 }}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const { colors, spacing, typography, radius } = useTheme();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q || "");

  // Sync with route parameter (e.g. if cleared from outside or navigated away)
  useEffect(() => {
    if (q !== undefined) {
      setQuery(q);
    }
  }, [q]);

  // Update route parameter on input change
  const handleTextChange = (text: string) => {
    setQuery(text);
    router.replace({
      pathname: "/(tabs)/search",
      params: text.trim() ? { q: text.trim() } : {},
    });
  };

  const handleClear = () => {
    setQuery("");
    router.replace({
      pathname: "/(tabs)/search",
      params: {},
    });
  };

  const trendingCategories = [
    { name: "Digital Art", query: "digital art" },
    { name: "Nature Photography", query: "nature" },
    { name: "Home Decor", query: "home" },
    { name: "Travel Ideas", query: "travel" },
    { name: "Cooking Recipes", query: "recipe" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.sidebarBg }}>
      {/* Header */}
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
        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: typography.scale.h3,
            color: colors.text,
          }}
        >
          Search
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: 4,
            borderRadius: radius.sm,
          }}
        >
          <X size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={{ padding: spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.inputBg,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.md,
            height: 40,
          }}
        >
          <Search size={16} color={colors.iconMuted} />
          <TextInput
            value={query}
            onChangeText={handleTextChange}
            placeholder="Search ideas or people..."
            placeholderTextColor={colors.placeholder}
            style={
              {
                flex: 1,
                marginLeft: spacing.sm,
                fontFamily: typography.families.body,
                fontSize: typography.scale.body,
                color: colors.text,
                outlineStyle: "none",
              } as any
            }
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <X size={16} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.md }}
      >
        <Text
          style={{
            fontFamily: typography.families.headingMedium,
            fontSize: typography.scale.caption,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
            marginTop: spacing.sm,
          }}
        >
          Trending Searches
        </Text>
        {trendingCategories.map((cat) => (
          <TouchableOpacity
            key={cat.name}
            onPress={() => {
              setQuery(cat.name);
              router.replace({
                pathname: "/(tabs)/search",
                params: { q: cat.query },
              });
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
            activeOpacity={0.7}
          >
            <Search
              size={14}
              color={colors.iconMuted}
              style={{ marginRight: spacing.sm }}
            />
            <Text
              style={{
                fontFamily: typography.families.bodyMedium,
                fontSize: typography.scale.body,
                color: colors.text,
              }}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function CreatePanel({ onClose }: { onClose: () => void }) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.sidebarBg }}>
      {/* Header */}
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
        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: typography.scale.h3,
            color: colors.text,
          }}
        >
          Create
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: 4,
            borderRadius: radius.sm,
          }}
        >
          <X size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={{ padding: spacing.md, gap: spacing.md }}>
        <TouchableOpacity
          onPress={() => {
            onClose();
            router.push("/create/pin");
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            gap: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.sm,
              backgroundColor: colors.overlayLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pin size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: typography.families.headingMedium,
                fontSize: typography.scale.bodyLarge,
                color: colors.text,
              }}
            >
              Create Pin
            </Text>
            <Text
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.caption,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              Share an image or design.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            onClose();
            router.push("/create/board");
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            gap: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.sm,
              backgroundColor: colors.overlayLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LayoutGrid size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: typography.families.headingMedium,
                fontSize: typography.scale.bodyLarge,
                color: colors.text,
              }}
            >
              Create Board
            </Text>
            <Text
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.caption,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              Group pins into boards.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SettingsPanel({
  onClose,
  handleLogout,
}: {
  onClose: () => void;
  handleLogout: () => void;
}) {
  const { colors, spacing, typography, radius } = useTheme();
  const { mode, setMode } = useThemeStore();

  const settingsItems = [
    { label: "Edit Profile", href: "/settings" },
    { label: "Child safety standards", href: "/legal/child-safety" },
    { label: "Help & FAQ", href: "/help/faq" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.sidebarBg }}>
      {/* Header */}
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
        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: typography.scale.h3,
            color: colors.text,
          }}
        >
          Settings
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: 4,
            borderRadius: radius.sm,
          }}
        >
          <X size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        {/* Appearance Theme Selector */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: typography.families.headingMedium,
              fontSize: typography.scale.caption,
              color: colors.textSecondary,
              marginBottom: spacing.sm,
            }}
          >
            Appearance
          </Text>
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
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor:
                    mode === m ? colors.surfaceElevated : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.caption,
                    color: mode === m ? colors.primary : colors.textSecondary,
                    textTransform: "capitalize",
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Links */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {settingsItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                onClose();
                router.push(item.href as any);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: spacing.md,
                borderBottomWidth: idx === settingsItems.length - 1 ? 0 : 1,
                borderBottomColor: colors.border,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontFamily: typography.families.bodyMedium,
                  fontSize: typography.scale.bodySmall,
                  color: colors.text,
                }}
              >
                {item.label}
              </Text>
              <ChevronRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Log Out */}
        <TouchableOpacity
          onPress={() => {
            onClose();
            handleLogout();
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          activeOpacity={0.7}
        >
          <LogOut
            size={16}
            color={colors.error}
            style={{ marginRight: spacing.sm }}
          />
          <Text
            style={{
              fontFamily: typography.families.bodyBold,
              fontSize: typography.scale.bodySmall,
              color: colors.error,
            }}
          >
            Log Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
