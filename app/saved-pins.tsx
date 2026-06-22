import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Lock, Globe } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { MasonryGrid } from "@/components/pins/MasonryGrid";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { FeedPin } from "@/types/database";

export default function SavedPinsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors, spacing, typography } = useTheme();
  const { showSidebar } = useBreakpoint();
  const { user, profile, setProfile } = useAuthStore();

  const [pins, setPins] = useState<FeedPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isCurrentUser = user?.id === userId;
  const [isPrivate, setIsPrivate] = useState(
    profile?.all_saves_private ?? true,
  );

  useEffect(() => {
    let isMounted = true;
    const fetchSavedPins = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("saves")
        .select(
          "pin:pin_id(*, profile:user_id(id, username, avatar_url, full_name), assets:pin_assets(*))",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (isMounted) {
        if (data) {
          const savedPins = data.map((s: any) => s.pin).filter(Boolean);
          setPins(savedPins);
        }
        setIsLoading(false);
      }
    };
    if (userId) {
      fetchSavedPins();
    }
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const togglePrivacy = async (value: boolean) => {
    setIsPrivate(value);
    if (!user) return;

    // Update local profile store immediately for responsive UI
    if (profile) {
      setProfile({ ...profile, all_saves_private: value });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ all_saves_private: value })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to update privacy:", error);
      // Revert if error
      setIsPrivate(!value);
      if (profile) setProfile({ ...profile, all_saves_private: !value });
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={showSidebar ? ["top", "bottom"] : ["top"]}
    >
      {/* Header bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.md,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <MasonryGrid
          pins={pins}
          isLoading={isLoading}
          ListHeaderComponent={
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ padding: spacing.xl, paddingBottom: spacing.lg }}>
                <Text
                  style={{
                    fontFamily: typography.families.headingBold,
                    fontSize: 32,
                    color: colors.text,
                  }}
                >
                  All Pins
                </Text>

                <Text
                  style={{
                    fontFamily: typography.families.body,
                    fontSize: typography.scale.body,
                    color: colors.textSecondary,
                    marginTop: spacing.sm,
                  }}
                >
                  Every pin you've saved
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: spacing.lg,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: spacing.sm,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.families.bodyMedium,
                        fontSize: typography.scale.bodySmall,
                        color: colors.textSecondary,
                      }}
                    >
                      {pins.length} Pins
                    </Text>
                    {!isCurrentUser && (
                      <Text
                        style={{
                          fontFamily: typography.families.bodyMedium,
                          fontSize: typography.scale.bodySmall,
                          color: colors.textSecondary,
                        }}
                      >
                        · Public
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              {isCurrentUser && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    backgroundColor: colors.surface,
                    padding: spacing.sm,
                    borderRadius: 12,
                  }}
                >
                  {isPrivate ? (
                    <Lock size={16} color={colors.icon} />
                  ) : (
                    <Globe size={16} color={colors.icon} />
                  )}
                  <Text
                    style={{
                      fontFamily: typography.families.bodyMedium,
                      fontSize: typography.scale.bodySmall,
                      color: colors.text,
                    }}
                  >
                    {isPrivate ? "Secret" : "Public"}
                  </Text>
                  <Switch
                    value={isPrivate}
                    onValueChange={togglePrivacy}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor="#fff"
                    style={{
                      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
                      marginLeft: 4,
                    }}
                  />
                </View>
              )}
            </View>
          }
          emptyMessage="You haven't saved any pins yet."
        />
      </View>
    </SafeAreaView>
  );
}
