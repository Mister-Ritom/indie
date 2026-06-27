import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Settings, Share as ShareIcon, MoreHorizontal, Ban, ShieldOff, Flag } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MasonryGrid } from "@/components/pins/MasonryGrid";
import { OptionsModal } from "@/components/ui/OptionsModal";
import { ReportModal } from "@/components/ui/ReportModal";
import { formatCount } from "@/utils/formatters";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { ProfileWithStats, FeedPin, Board } from "@/types/database";

interface ProfileViewProps {
  userId: string;
  isCurrentUser: boolean;
}

const absoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export function ProfileView({ userId, isCurrentUser }: ProfileViewProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { showSidebar, grid } = useBreakpoint();
  
  const contentWidth = showSidebar ? width - grid.sidebarWidth : width;
  const cardWidth = (contentWidth - spacing.md * 3) / 2;

  const { user } = useAuthStore();

  const [profile, setProfile] = useState<ProfileWithStats | null>(null);
  const [activeTab, setActiveTab] = useState<"created" | "saved">("created");
  const [pins, setPins] = useState<FeedPin[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentSaves, setRecentSaves] = useState<string[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const fetchProfile = useCallback(
    async (background = false) => {
      if (!background) setIsLoading(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (p) {
        const [
          pinsCount,
          followersCount,
          followingCount,
          boardsCount,
          isFollowing,
        ] = await Promise.all([
          supabase
            .from("pins")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("follows")
            .select("follower_id", { count: "exact", head: true })
            .eq("following_id", userId),
          supabase
            .from("follows")
            .select("following_id", { count: "exact", head: true })
            .eq("follower_id", userId),
          supabase
            .from("boards")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_private", false),
          user && !isCurrentUser
            ? supabase
                .from("follows")
                .select("follower_id")
                .eq("follower_id", user.id)
                .eq("following_id", userId)
                .single()
            : Promise.resolve({ data: null }),
        ]);

        setProfile({
          ...p,
          pins_count: pinsCount.count ?? 0,
          followers_count: followersCount.count ?? 0,
          following_count: followingCount.count ?? 0,
          boards_count: boardsCount.count ?? 0,
          is_following: !!isFollowing.data,
        });

        // Fetch block status
        if (user && !isCurrentUser) {
          const { data: blockData } = await supabase
            .from('user_blocks')
            .select('blocked_id')
            .eq('blocker_id', user.id)
            .eq('blocked_id', userId)
            .single();
          setIsBlocked(!!blockData);
        }
      }
      if (!background) setIsLoading(false);
    },
    [userId, user?.id, isCurrentUser],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchContent = useCallback(async (force = false) => {
    if (!force && loadedUserId === userId) return;

    // Fetch created pins
    const { data: pinsData } = await supabase
      .from("pins")
      .select(
        "*, profile:user_id(id, username, avatar_url, full_name), assets:pin_assets(*)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setPins(pinsData ?? []);

    // Fetch boards
    const { data: boardsData } = await supabase
      .from("boards")
      .select(`
        *,
        saves(
          pin:pin_id(id, assets:pin_assets(*))
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    // Process boards to extract preview urls
    const processedBoards = (boardsData ?? []).map((board: any) => {
      const boardSaves = (board.saves || []).slice(0, 4);
      const urls = boardSaves
        .map((s: any) => {
          const pin = Array.isArray(s.pin) ? s.pin[0] : s.pin;
          if (!pin || !pin.assets || pin.assets.length === 0) return null;
          const thumb = pin.assets.find(
            (a: any) => a.variant === "thumb" || a.variant === "360",
          );
          return thumb ? thumb.url : pin.assets[0].url;
        })
        .filter(Boolean);
      return { ...board, previewUrls: urls };
    });
    setBoards(processedBoards);

    // Fetch recent saves for "Quick Saves"
    const { data: savesData, error: savesError } = await supabase
      .from("saves")
      .select("pin:pin_id(id, assets:pin_assets(*))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4);

    if (savesError) {
      console.error("Error fetching recent saves:", savesError);
    }

    if (savesData) {
      const urls = savesData
        .map((s: any) => {
          const pin = Array.isArray(s.pin) ? s.pin[0] : s.pin;
          if (!pin || !pin.assets || pin.assets.length === 0) return null;
          const thumb = pin.assets.find(
            (a: any) => a.variant === "thumb" || a.variant === "360",
          );
          return thumb ? thumb.url : pin.assets[0].url;
        })
        .filter(Boolean);
      setRecentSaves(urls);
    }
    
    setLoadedUserId(userId);
  }, [userId, loadedUserId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchProfile(true), fetchContent(true)]);
    setIsRefreshing(false);
  };

  const handleFollow = async () => {
    if (!profile) return;
    if (!user) {
      alert("Please log in to follow users.");
      return;
    }
    const wasFollowing = profile.is_following;
    setProfile((p) =>
      p
        ? {
            ...p,
            is_following: !wasFollowing,
            followers_count: p.followers_count + (wasFollowing ? -1 : 1),
          }
        : null,
    );

    if (wasFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);
      if (error) console.error("Unfollow error:", error);
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: userId });
      if (error) console.error("Follow error:", error);
    }
  };

  const handleShare = () => {
    if (profile) {
      Share.share({
        url: `https://me.ritom.indie/user/${profile.username}`,
        message: `Check out @${profile.username} on Indie!`,
      });
    }
  };

  const handleBlock = useCallback(async () => {
    if (!user) return;
    if (isBlocked) {
      await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);
      setIsBlocked(false);
    } else {
      await supabase
        .from('user_blocks')
        .insert({ blocker_id: user.id, blocked_id: userId });
      setIsBlocked(true);
    }
  }, [user, isBlocked, userId]);

  const authProfile = useAuthStore((state) => state.profile);

  if (!profile) return null;

  const displayProfile =
    isCurrentUser && authProfile ? { ...profile, ...authProfile } : profile;

  const renderHeader = () => (
    <View style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ alignItems: "center", padding: spacing.xl }}>
        <Avatar
          uri={displayProfile.avatar_url}
          name={displayProfile.full_name ?? displayProfile.username}
          size="xl"
        />

        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: 28,
            color: colors.text,
            marginTop: spacing.md,
          }}
        >
          {displayProfile.full_name ?? displayProfile.username}
        </Text>

        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            marginTop: 4,
          }}
        >
          {`@${displayProfile.username}`}
        </Text>

        {/* Followers / Following row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            marginTop: spacing.sm,
          }}
        >
          <Text
            style={{
              fontFamily: typography.families.bodyMedium,
              fontSize: typography.scale.body,
              color: colors.text,
            }}
          >
            {`${formatCount(displayProfile.followers_count)} `}
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: typography.families.body,
              }}
            >
              {"followers"}
            </Text>
          </Text>

          <Text
            style={{
              fontFamily: typography.families.bodyMedium,
              fontSize: typography.scale.body,
              color: colors.textSecondary,
            }}
          >
            {"·"}
          </Text>

          <Text
            style={{
              fontFamily: typography.families.bodyMedium,
              fontSize: typography.scale.body,
              color: colors.text,
            }}
          >
            {`${formatCount(displayProfile.following_count)} `}
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: typography.families.body,
              }}
            >
              {"following"}
            </Text>
          </Text>
        </View>

        {displayProfile.bio ? (
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.text,
              textAlign: "center",
              marginTop: spacing.md,
              maxWidth: 400,
            }}
          >
            {displayProfile.bio}
          </Text>
        ) : null}

        {/* Action buttons */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginTop: spacing.xl,
          }}
        >
          <Button
            label="Share"
            variant="secondary"
            onPress={handleShare}
            icon={<ShareIcon size={18} color={colors.text} />}
          />

          {isCurrentUser ? (
            <>
              <Button
                label="Edit Profile"
                variant="secondary"
                onPress={() => router.push("/settings/edit-profile")}
              />
              <TouchableOpacity
                onPress={() => router.push("/settings")}
                style={{
                  padding: 12,
                  backgroundColor: colors.surface,
                  borderRadius: radius.pill,
                }}
              >
                <Settings size={22} color={colors.icon} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {isBlocked ? (
                <Button
                  label="Unblock"
                  variant="secondary"
                  onPress={handleBlock}
                />
              ) : (
                <Button
                  label={profile.is_following ? "Following" : "Follow"}
                  variant={profile.is_following ? "secondary" : "primary"}
                  onPress={handleFollow}
                />
              )}
              <TouchableOpacity
                onPress={() => setShowOptions(true)}
                style={{
                  padding: 12,
                  backgroundColor: colors.surface,
                  borderRadius: radius.pill,
                }}
              >
                <MoreHorizontal size={22} color={colors.icon} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Tabs + Content — hidden when blocked */}
      {isBlocked ? (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            marginTop: spacing.xxl,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <Ban size={28} color={colors.textSecondary} />
          </View>
          <Text
            style={{
              fontFamily: typography.families.headingMedium,
              fontSize: typography.scale.bodyLarge,
              color: colors.text,
              textAlign: 'center',
              marginBottom: spacing.sm,
            }}
          >
            You've blocked @{displayProfile.username}
          </Text>
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.textSecondary,
              textAlign: 'center',
              maxWidth: 280,
              marginBottom: spacing.xl,
            }}
          >
            Unblock to see their pins and boards.
          </Text>
          <Button label="Unblock" variant="secondary" onPress={handleBlock} />
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.xl,
            marginBottom: spacing.lg,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("created")}
            style={{
              paddingBottom: spacing.sm,
              borderBottomWidth: 3,
              borderBottomColor:
                activeTab === "created" ? colors.primary : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily:
                  activeTab === "created"
                    ? typography.families.heading
                    : typography.families.bodyMedium,
                fontSize: typography.scale.bodyLarge,
                color:
                  activeTab === "created" ? colors.text : colors.textSecondary,
              }}
            >
              {"Created"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("saved")}
            style={{
              paddingBottom: spacing.sm,
              borderBottomWidth: 3,
              borderBottomColor:
                activeTab === "saved" ? colors.primary : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily:
                  activeTab === "saved"
                    ? typography.families.heading
                    : typography.families.bodyMedium,
                fontSize: typography.scale.bodyLarge,
                color: activeTab === "saved" ? colors.text : colors.textSecondary,
              }}
            >
              {"Saved"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

          {/* Content */}
          {!isBlocked && (
            <View style={{ flex: 1 }}>
              {/* Created Tab */}
              <View style={{ flex: 1, display: activeTab === "created" ? "flex" : "none" }}>
                <MasonryGrid
                  pins={pins}
                  isLoading={isLoading}
                  emptyMessage="No pins created yet."
                  ListHeaderComponent={renderHeader()}
                  isRefreshing={isRefreshing}
                  onRefresh={handleRefresh}
                />
              </View>

              {/* Saved Tab */}
              <View style={{ flex: 1, display: activeTab === "saved" ? "flex" : "none" }}>
                <ScrollView 
                  style={{ flex: 1 }} 
                  contentContainerStyle={{ paddingBottom: spacing.xxl }}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshing}
                      onRefresh={handleRefresh}
                      tintColor={colors.primary}
                      colors={[colors.primary]}
                    />
                  }
                >
                  {renderHeader()}
                  <View
                    style={{
                      paddingHorizontal: spacing.md,
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: spacing.md,
                    }}
                  >
                    {/* All / Quick Saves Card */}
                    {(isCurrentUser || !displayProfile.all_saves_private) && (
                      <TouchableOpacity
                        onPress={() => router.push(`/saved-pins?userId=${userId}`)}
                        style={{
                          width: cardWidth,
                          height: cardWidth,
                          backgroundColor: recentSaves.length === 0 ? colors.border : colors.surface,
                          borderRadius: radius.lg,
                          overflow: "hidden",
                        }}
                      >
                        {/* Cover mosaic */}
                        {recentSaves.length > 0 && (
                          <View
                            style={{
                              ...absoluteFill,
                              flexDirection: "row",
                              flexWrap: "wrap",
                            }}
                          >
                            {recentSaves.map((url, i) => (
                              <View
                                key={i}
                                style={{
                                  width: recentSaves.length === 1 ? "100%" : "50%",
                                  height: recentSaves.length <= 2 ? "100%" : "50%",
                                }}
                              >
                                <Image
                                  source={{ uri: url }}
                                  contentFit="cover"
                                  style={{ width: "100%", height: "100%" }}
                                />
                              </View>
                            ))}
                            {/* Scrim */}
                            <View
                              style={{
                                ...absoluteFill,
                                backgroundColor: "rgba(0,0,0,0.3)",
                              }}
                            />
                          </View>
                        )}
                        
                        {/* Label */}
                        <View
                          style={{
                            ...absoluteFill,
                            padding: spacing.md,
                            justifyContent: "flex-end",
                            zIndex: 10,
                          }}
                          pointerEvents="none"
                        >
                          <Text
                            style={{
                              fontFamily: typography.families.headingMedium,
                              fontSize: typography.scale.bodyLarge,
                              color: recentSaves.length > 0 ? "#fff" : colors.text,
                            }}
                          >
                            {"Quick Saves"}
                          </Text>
                          {displayProfile.all_saves_private && (
                            <Text
                              style={{
                                fontFamily: typography.families.body,
                                fontSize: typography.scale.caption,
                                color: recentSaves.length > 0 ? "rgba(255,255,255,0.8)" : colors.textSecondary,
                              }}
                            >
                              {"Private"}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* Board cards */}
                    {boards.map((board) => (
                      <TouchableOpacity
                        key={board.id}
                        onPress={() => router.push(`/board/${board.id}`)}
                        style={{
                          width: cardWidth,
                          height: cardWidth,
                          backgroundColor: (!board.previewUrls || board.previewUrls.length === 0) ? colors.border : colors.surface,
                          borderRadius: radius.lg,
                          overflow: "hidden",
                        }}
                      >
                        {/* Cover mosaic for boards */}
                        {board.previewUrls && board.previewUrls.length > 0 && (
                          <View
                            style={{
                              ...absoluteFill,
                              flexDirection: "row",
                              flexWrap: "wrap",
                            }}
                          >
                            {board.previewUrls.map((url: string, i: number) => (
                              <View
                                key={i}
                                style={{
                                  width: board.previewUrls.length === 1 ? "100%" : "50%",
                                  height: board.previewUrls.length <= 2 ? "100%" : "50%",
                                }}
                              >
                                <Image
                                  source={{ uri: url }}
                                  contentFit="cover"
                                  style={{ width: "100%", height: "100%" }}
                                />
                              </View>
                            ))}
                            {/* Scrim */}
                            <View
                              style={{
                                ...absoluteFill,
                                backgroundColor: "rgba(0,0,0,0.3)",
                              }}
                            />
                          </View>
                        )}
                        <View
                          style={{
                            flex: 1,
                            padding: spacing.md,
                            justifyContent: "flex-end",
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: typography.families.headingMedium,
                              fontSize: typography.scale.bodyLarge,
                              color: (board.previewUrls && board.previewUrls.length > 0) ? "#fff" : colors.text,
                            }}
                          >
                            {board.name}
                          </Text>
                          {board.is_private ? (
                            <Text
                              style={{
                                fontFamily: typography.families.body,
                                fontSize: typography.scale.caption,
                                color: (board.previewUrls && board.previewUrls.length > 0) ? "rgba(255,255,255,0.8)" : colors.textSecondary,
                              }}
                            >
                              {"Private"}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

      {/* Options Modal */}
      <OptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        items={[
          {
            label: 'Report Profile',
            icon: <Flag size={20} color={colors.icon} />,
            onPress: () => setShowReport(true),
          },
          {
            label: isBlocked ? 'Unblock User' : 'Block User',
            icon: isBlocked
              ? <ShieldOff size={20} color="#DC2626" />
              : <Ban size={20} color="#DC2626" />,
            onPress: handleBlock,
            destructive: true,
          },
        ]}
      />

      {/* Report Modal */}
      <ReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        type="user"
        targetId={userId}
      />
    </View>
  );
}
