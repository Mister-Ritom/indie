import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Search as SearchIcon,
  X,
  Camera,
  ChevronRight,
} from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { SaveBoardPicker } from "@/components/pins/SaveBoardPicker";
import { DiscoveryFeed } from "@/components/discovery/DiscoveryFeed";
import { PinCard } from "@/components/pins/PinCard";
import { UserSearchCard } from "@/components/profile/UserSearchCard";
import { supabase } from "@/lib/supabase/client";
import { columnWidth } from "@/utils/imageVariants";
import type { FeedPin, Profile } from "@/types/database";
import { router, useLocalSearchParams } from "expo-router";

export default function SearchScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { showSidebar, masonryCols, grid } = useBreakpoint();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState(q || "");
  const [debouncedQuery, setDebouncedQuery] = useState(q || "");
  const [pinResults, setPinResults] = useState<FeedPin[]>([]);
  const [profileResults, setProfileResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingPin, setSavingPin] = useState<FeedPin | null>(null);

  const contentWidth = showSidebar ? width - grid.sidebarWidth : width;
  const colW = columnWidth(
    contentWidth,
    masonryCols,
    grid.gap,
    grid.contentPadding,
  );

  // Sync URL query state
  useEffect(() => {
    if (q !== undefined) {
      setQuery(q);
    }
  }, [q]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search
  useEffect(() => {
    if (!debouncedQuery) {
      setPinResults([]);
      setProfileResults([]);
      return;
    }
    let isMounted = true;
    const fetchResults = async () => {
      setIsLoading(true);

      // Parallel queries for pins and profiles
      const [pinsResponse, profilesResponse] = await Promise.all([
        supabase
          .from("pins")
          .select(
            "*, profile:user_id(id, username, avatar_url, full_name), assets:pin_assets(*), likes!left(user_id), saves!left(user_id), comments(id)",
          )
          .or(
            `title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`,
          )
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("profiles")
          .select("*")
          .or(
            `username.ilike.%${debouncedQuery}%,full_name.ilike.%${debouncedQuery}%`,
          )
          .limit(10),
      ]);

      if (!isMounted) return;

      if (profilesResponse.data && !profilesResponse.error) {
        setProfileResults(profilesResponse.data);
      } else {
        setProfileResults([]);
      }

      if (pinsResponse.data && !pinsResponse.error) {
        const pins = pinsResponse.data.map((d: any) => ({
          ...d,
          likes_count: d.likes?.[0]?.count ?? 0,
          saves_count: d.saves?.[0]?.count ?? 0,
          comments_count: d.comments?.[0]?.count ?? 0,
          is_liked: false,
          is_saved: false,
        }));
        setPinResults(pins);
      } else {
        setPinResults([]);
      }

      setIsLoading(false);
    };
    fetchResults();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  const renderItem = useCallback(
    ({ item }: { item: FeedPin }) => {
      return (
        <View style={{ padding: spacing.sm / 2 }}>
          <PinCard pin={item} columnWidth={colW} onSavePress={setSavingPin} />
        </View>
      );
    },
    [colW, spacing.sm],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={showSidebar ? ["top", "bottom"] : ["top"]}
    >
      <View style={{ flex: 1, paddingTop: showSidebar ? 0 : 80 }}>
        {!debouncedQuery ? (
          <DiscoveryFeed onSavePin={setSavingPin} />
        ) : isLoading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlashList
            data={pinResults}
            numColumns={masonryCols}
            masonry={true}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.xxl,
            }}
            ListEmptyComponent={
              pinResults.length === 0 && profileResults.length === 0 ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 100,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.families.heading,
                      fontSize: typography.scale.h3,
                      color: colors.textSecondary,
                    }}
                  >
                    No results found for "{debouncedQuery}"
                  </Text>
                </View>
              ) : null
            }
            ListHeaderComponent={
              profileResults.length > 0 ? (
                <View
                  style={{ marginBottom: spacing.xl, marginTop: spacing.md }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: spacing.md,
                      paddingHorizontal: spacing.md,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.families.headingBold,
                        fontSize: 20,
                        color: colors.text,
                      }}
                    >
                      Users
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        router.push(
                          `/search/users?q=${encodeURIComponent(debouncedQuery)}`,
                        )
                      }
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          fontFamily: typography.families.bodyMedium,
                          fontSize: typography.scale.body,
                          color: colors.primary,
                        }}
                      >
                        View All
                      </Text>
                      <ChevronRight
                        size={16}
                        color={colors.primary}
                        style={{ marginLeft: 2 }}
                      />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: spacing.md,
                      gap: spacing.md,
                    }}
                  >
                    {profileResults.map((profile) => (
                      <View key={profile.id} style={{ width: 140 }}>
                        <UserSearchCard profile={profile} columnWidth={140} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : undefined
            }
          />
        )}
      </View>

      {!showSidebar && (
        <View style={{ position: 'absolute', top: (insets.top || 0) + spacing.md, left: spacing.md, right: spacing.md, zIndex: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.inputBg,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              height: 48,
            }}
          >
            <SearchIcon size={20} color={colors.iconMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for ideas or people"
              placeholderTextColor={colors.placeholder}
              style={{
                flex: 1,
                marginLeft: spacing.sm,
                fontFamily: typography.families.body,
                fontSize: typography.scale.bodyLarge,
                color: colors.text,
                outlineStyle: 'none',
              } as any}
              autoFocus={false}
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={20} color={colors.icon} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => {}}>
                <Camera size={20} color={colors.iconMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <SaveBoardPicker
        visible={!!savingPin}
        pin={savingPin}
        onClose={() => setSavingPin(null)}
      />
    </SafeAreaView>
  );
}
