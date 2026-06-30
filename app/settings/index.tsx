import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from "react-native";
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
  ChevronRight,
  Bell,
  Globe,
  Lock,
  HelpCircle,
  Mail,
  Smartphone,
  Ban,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase/client";
import { EditProfileForm } from "@/components/profile/EditProfileForm";

type SectionId =
  | "edit-profile"
  | "manage-interests"
  | "appearance"
  | "notifications"
  | "privacy"
  | "blocked-users"
  | "language"
  | "terms"
  | "privacy-policy"
  | "child-safety"
  | "help"
  | "contact"
  | "logout"
  | "delete-account";

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  action?: () => void;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function SettingsScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { mode, setMode } = useThemeStore();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [activeSection, setActiveSection] = useState<SectionId>("edit-profile");
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [activityVisible, setActivityVisible] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("Error signing out: ", (error as Error).message);
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true },
    );
  };

  const handleDeleteAccount = async () => {
    router.replace("/legal/delete-account");
  };

  const navGroups: NavGroup[] = [
    {
      title: "Account",
      items: [
        {
          id: "edit-profile",
          label: "Edit profile",
          icon: (
            <User
              size={18}
              color={
                activeSection === "edit-profile" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
        {
          id: "manage-interests",
          label: "Manage interests",
          icon: (
            <Tag
              size={18}
              color={
                activeSection === "manage-interests" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "appearance",
          label: "Appearance",
          icon: (
            <Monitor
              size={18}
              color={
                activeSection === "appearance" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: (
            <Bell
              size={18}
              color={
                activeSection === "notifications" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
        {
          id: "privacy",
          label: "Privacy",
          icon: (
            <Lock
              size={18}
              color={
                activeSection === "privacy" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
        {
          id: "blocked-users",
          label: "Blocked users",
          icon: (
            <Ban
              size={18}
              color={
                activeSection === "blocked-users" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
        {
          id: "language",
          label: "Language & region",
          icon: (
            <Globe
              size={18}
              color={
                activeSection === "language" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          id: "terms",
          label: "Terms of Service",
          icon: (
            <FileText
              size={18}
              color={
                activeSection === "terms" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
        {
          id: "privacy-policy",
          label: "Privacy Policy",
          icon: (
            <Shield
              size={18}
              color={
                activeSection === "privacy-policy" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
        {
          id: "child-safety",
          label: "Child safety standards",
          icon: (
            <Shield
              size={18}
              color={
                activeSection === "child-safety" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
        {
          id: "help",
          label: "Help & FAQ",
          icon: (
            <HelpCircle
              size={18}
              color={
                activeSection === "help" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
        {
          id: "contact",
          label: "Contact support",
          icon: (
            <Mail
              size={18}
              color={
                activeSection === "contact" && isDesktop
                  ? colors.primary
                  : colors.icon
              }
            />
          ),
        },
      ],
    },
    {
      title: "Actions",
      items: [
        {
          id: "logout",
          label: "Log out",
          icon: <LogOut size={18} color={colors.error} />,
          danger: true,
          action: handleLogout,
        },
        {
          id: "delete-account",
          label: "Delete account",
          icon: <Trash2 size={18} color={colors.error} />,
          danger: true,
          action: handleDeleteAccount,
        },
      ],
    },
  ];

  // ── Shared primitives ───────────────────────────────────────────────────────

  const renderToggle = (value: boolean, onToggle: () => void) => (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: value ? colors.primary : colors.border,
        justifyContent: "center",
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: colors.surface,
          alignSelf: value ? "flex-end" : "flex-start",
        }}
      />
    </TouchableOpacity>
  );

  const renderRow = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    rightElement?: React.ReactNode,
    danger?: boolean,
  ) => (
    <TouchableOpacity
      key={label}
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
            color: danger ? colors.error : colors.text,
          }}
        >
          {label}
        </Text>
      </View>
      {rightElement ?? <ChevronRight size={16} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  const renderCard = (children: React.ReactNode) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        overflow: "hidden",
        marginBottom: spacing.lg,
      }}
    >
      {children}
    </View>
  );

  const renderSectionHeading = (title: string) => (
    <Text
      style={{
        fontFamily: typography.families.headingMedium,
        fontSize: typography.scale.h3,
        color: colors.text,
        marginBottom: spacing.md,
      }}
    >
      {title}
    </Text>
  );

  // ── Section panels ──────────────────────────────────────────────────────────

  const renderPanelContent = (id: SectionId) => {
    switch (id) {
      case "edit-profile":
        return (
          <View>
            {isDesktop && renderSectionHeading("Edit profile")}
            {renderCard(
              <View style={{ padding: spacing.xl }}>
                <EditProfileForm onSuccess={() => {}} />
              </View>
            )}
          </View>
        );

      case "manage-interests":
        return (
          <View>
            {isDesktop && renderSectionHeading("Manage interests")}
            {renderCard(
              renderRow(
                <Tag size={20} color={colors.icon} />,
                "Manage interests",
                () => router.push("/settings/manage-interests"),
              ),
            )}
          </View>
        );

      case "appearance":
        return (
          <View>
            {isDesktop && renderSectionHeading("Appearance")}
            {renderCard(
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
              </View>,
            )}
          </View>
        );

      case "notifications":
        return (
          <View>
            {isDesktop && renderSectionHeading("Notifications")}
            {renderCard(
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
                    <Bell size={20} color={colors.icon} />
                    <Text
                      style={{
                        fontFamily: typography.families.bodyMedium,
                        fontSize: typography.scale.bodyLarge,
                        color: colors.text,
                      }}
                    >
                      Push notifications
                    </Text>
                  </View>
                  {renderToggle(notifPush, () => setNotifPush((v) => !v))}
                </View>
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
                    <Mail size={20} color={colors.icon} />
                    <Text
                      style={{
                        fontFamily: typography.families.bodyMedium,
                        fontSize: typography.scale.bodyLarge,
                        color: colors.text,
                      }}
                    >
                      Email notifications
                    </Text>
                  </View>
                  {renderToggle(notifEmail, () => setNotifEmail((v) => !v))}
                </View>
              </>,
            )}
          </View>
        );

      case "privacy":
        return (
          <View>
            {isDesktop && renderSectionHeading("Privacy")}
            {renderCard(
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
                    <Lock size={20} color={colors.icon} />
                    <Text
                      style={{
                        fontFamily: typography.families.bodyMedium,
                        fontSize: typography.scale.bodyLarge,
                        color: colors.text,
                      }}
                    >
                      Private profile
                    </Text>
                  </View>
                  {renderToggle(privateProfile, () =>
                    setPrivateProfile((v) => !v),
                  )}
                </View>
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
                    <User size={20} color={colors.icon} />
                    <Text
                      style={{
                        fontFamily: typography.families.bodyMedium,
                        fontSize: typography.scale.bodyLarge,
                        color: colors.text,
                      }}
                    >
                      Show activity status
                    </Text>
                  </View>
                  {renderToggle(activityVisible, () =>
                    setActivityVisible((v) => !v),
                  )}
                </View>
              </>,
            )}
          </View>
        );

      case "blocked-users":
        return (
          <View>
            {isDesktop && renderSectionHeading("Blocked users")}
            {renderCard(
              <>
                {renderRow(
                  <Ban size={20} color={colors.icon} />,
                  "Manage blocked users",
                  () => router.push("/settings/blocked-users"),
                )}
              </>,
            )}
          </View>
        );

      case "language":
        return (
          <View>
            {isDesktop && renderSectionHeading("Language & region")}
            {renderCard(
              <>
                {renderRow(
                  <Globe size={20} color={colors.icon} />,
                  "Language",
                  () => {},
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: typography.scale.body,
                    }}
                  >
                    English
                  </Text>,
                )}
                {renderRow(
                  <Globe size={20} color={colors.icon} />,
                  "Region",
                  () => {},
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: typography.scale.body,
                    }}
                  >
                    India
                  </Text>,
                )}
              </>,
            )}
          </View>
        );

      case "terms":
        return (
          <View>
            {isDesktop && renderSectionHeading("Terms of Service")}
            {renderCard(
              renderRow(
                <FileText size={20} color={colors.icon} />,
                "Terms of Service",
                () => router.push("/legal/terms"),
              ),
            )}
          </View>
        );

      case "privacy-policy":
        return (
          <View>
            {isDesktop && renderSectionHeading("Privacy Policy")}
            {renderCard(
              renderRow(
                <Shield size={20} color={colors.icon} />,
                "Privacy Policy",
                () => router.push("/legal/privacy"),
              ),
            )}
          </View>
        );

      case "child-safety":
        return (
          <View>
            {isDesktop && renderSectionHeading("Child safety standards")}
            {renderCard(
              renderRow(
                <Shield size={20} color={colors.icon} />,
                "Child safety standards policy",
                () => router.push("/legal/child-safety"),
              ),
            )}
          </View>
        );

      case "help":
        return (
          <View>
            {isDesktop && renderSectionHeading("Help & FAQ")}
            {renderCard(
              <>
                {renderRow(
                  <HelpCircle size={20} color={colors.icon} />,
                  "FAQ",
                  () => router.push("/help/faq"),
                )}
                {renderRow(
                  <FileText size={20} color={colors.icon} />,
                  "Getting started",
                  () => router.push("/help/getting-started"),
                )}
              </>,
            )}
          </View>
        );

      case "contact":
        return (
          <View>
            {isDesktop && renderSectionHeading("Contact support")}
            {renderCard(
              <>
                {renderRow(
                  <Mail size={20} color={colors.icon} />,
                  "Email support",
                  () => router.push("/help/contact"),
                )}
                {renderRow(
                  <FileText size={20} color={colors.icon} />,
                  "Submit feedback",
                  () => router.push("/help/feedback"),
                )}
              </>,
            )}
          </View>
        );

      case "logout":
        handleLogout();
        return null;

      case "delete-account":
        handleDeleteAccount();
        return null;

      default:
        return null;
    }
  };

  // ── Mobile layout (unchanged) ───────────────────────────────────────────────

  if (!isDesktop) {
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
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
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
          {navGroups.map((group) => (
            <View key={group.title} style={{ marginBottom: spacing.xl }}>
              <Text
                style={{
                  fontFamily: typography.families.headingMedium,
                  fontSize: typography.scale.body,
                  color: colors.textSecondary,
                  marginBottom: spacing.sm,
                  marginLeft: spacing.md,
                }}
              >
                {group.title.toUpperCase()}
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  overflow: "hidden",
                }}
              >
                {group.items.map((item) =>
                  renderRow(
                    item.icon,
                    item.label,
                    item.action ??
                      (() => {
                        if (item.id === "terms") {
                          router.push("/legal/terms");
                        } else if (item.id === "privacy-policy") {
                          router.push("/legal/privacy");
                        } else if (item.id === "child-safety") {
                          router.push("/legal/child-safety");
                        } else if (item.id === "privacy") {
                          router.push("/settings/privacy-settings");
                        } else {
                          router.push(`/settings/${item.id}` as any);
                        }
                      }),
                    undefined,
                    item.danger,
                  ),
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Sidebar */}
        <View
          style={{
            width: 240,
            flexShrink: 0,
            backgroundColor: colors.surface,
            borderRightWidth: 1,
            borderRightColor: colors.border,
          }}
        >
          <ScrollView
            contentContainerStyle={{
              padding: spacing.sm,
              paddingTop: spacing.lg,
            }}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingHorizontal: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              <ArrowLeft size={20} color={colors.icon} />
              <Text
                style={{
                  fontFamily: typography.families.headingMedium,
                  fontSize: typography.scale.h3,
                  color: colors.text,
                }}
              >
                Settings
              </Text>
            </TouchableOpacity>

            {navGroups.map((group) => (
              <View key={group.title} style={{ marginBottom: spacing.md }}>
                <Text
                  style={{
                    fontFamily: typography.families.headingMedium,
                    fontSize: typography.scale.bodySmall,
                    color: colors.textSecondary,
                    paddingHorizontal: spacing.sm,
                    marginBottom: spacing.xs,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  {group.title}
                </Text>
                {group.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        if (item.action) {
                          item.action();
                        } else {
                          setActiveSection(item.id);
                        }
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.sm,
                        borderRadius: radius.md,
                        marginBottom: 2,
                        backgroundColor: isActive
                          ? colors.background
                          : "transparent",
                      }}
                    >
                      {item.icon}
                      <Text
                        style={{
                          fontFamily: isActive
                            ? typography.families.bodyMedium
                            : typography.families.body,
                          fontSize: typography.scale.body,
                          color: item.danger
                            ? colors.error
                            : isActive
                              ? colors.primary
                              : colors.text,
                        }}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Content panel */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: spacing.xl,
            maxWidth: 900,
            width: "100%",
            alignSelf: "flex-start",
          }}
        >
          {renderPanelContent(activeSection)}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
