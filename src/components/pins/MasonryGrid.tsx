import React, { useCallback, useMemo } from "react";
import {
  View,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { PinCard } from "./PinCard";
import { SkeletonPinCard } from "./SkeletonPinCard";
import { NativeAdCard } from "./NativeAdCard";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { columnWidth } from "@/utils/imageVariants";
import type { FeedPin } from "@/types/database";
import { useSidebarStore } from "@/stores/sidebarStore";

/** Sentinel item type for skeleton placeholders */
type SkeletonItem = { _skeleton: true; _skeletonIndex: number; id: string };
/** Sentinel item type for native ad slots */
type AdItem = { _ad: true; id: string };
type GridItem = FeedPin | SkeletonItem | AdItem;

/** Minimum number of posts before an ad can appear */
const AD_MIN_OFFSET = 5;
/** Maximum post index at which an ad can appear */
const AD_MAX_OFFSET = 50;

interface MasonryGridProps {
  pins: FeedPin[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  emptyMessage?: string;
  ListHeaderComponent?: React.ReactElement;
  onSavePin?: (pin: FeedPin) => void;
  scrollsToTop?: boolean;
  /** Number of skeleton placeholder cards to show at the top (e.g. active uploads) */
  skeletonCount?: number;
}

export function MasonryGrid({
  pins,
  isLoading = false,
  isRefreshing = false,
  isLoadingMore = false,
  onRefresh,
  onEndReached,
  emptyMessage = "No pins yet",
  ListHeaderComponent,
  onSavePin,
  scrollsToTop = true,
  skeletonCount = 0,
}: MasonryGridProps) {
  const { colors, spacing, typography } = useTheme();
  const { width } = useWindowDimensions();
  const { showSidebar, grid } = useBreakpoint();
  const activePanel = useSidebarStore((s) => s.activePanel);

  // Actual sidebar footprint: 80px icon bar, +360px when a panel is open
  const actualSidebarWidth = showSidebar ? (activePanel ? 80 + 360 : 80) : 0;
  const contentWidth = width - actualSidebarWidth;

  // Derive column count from available width
  const MIN_CARD_WIDTH = 170;
  const usableWidth = contentWidth - grid.contentPadding * 2;
  const numCols = Math.max(
    2,
    Math.floor((usableWidth + grid.gap) / (MIN_CARD_WIDTH + grid.gap))
  );

  const colW = columnWidth(contentWidth, numCols, grid.gap, grid.contentPadding);

  // Generate randomized ad slots across the feed.
  // The schedule is tied to the first pin's ID so it stays fixed during infinite scroll,
  // but recalculates with a new random pattern on refresh or new feed loads.
  const firstPinId = pins[0]?.id ?? null;
  const adPositions = useMemo(() => {
    const positions = new Set<number>();
    if (!firstPinId) return positions;

    // First ad randomly placed between 5th and 10th post (indices 4..9)
    let pos = Math.floor(Math.random() * 6) + 4;
    while (pos < 500) {
      positions.add(pos);
      // Subsequent ads spaced randomly between 7 and 16 posts apart
      const gap = Math.floor(Math.random() * 10) + 7;
      pos += gap;
    }
    return positions;
  }, [firstPinId]);

  // Build data: skeleton sentinels first, then real pins with ad sentinels
  const skeletonItems: SkeletonItem[] = Array.from({ length: skeletonCount }, (_, i) => ({
    _skeleton: true as const,
    _skeletonIndex: i,
    id: `__skeleton_${i}`,
  }));

  const gridData: GridItem[] = [...skeletonItems];
  pins.forEach((pin, i) => {
    gridData.push(pin);
    // Insert ad sentinel at randomized intervals throughout the feed
    if (adPositions.has(i) && pins.length >= 5) {
      gridData.push({ _ad: true, id: `__ad_${i}` } satisfies AdItem);
    }
  });

  const renderItem = useCallback(
    ({ item }: { item: GridItem }) => {
      if ('_skeleton' in item && item._skeleton) {
        return <SkeletonPinCard columnWidth={colW} index={item._skeletonIndex} />;
      }
      if ('_ad' in item && item._ad) {
        return <NativeAdCard columnWidth={colW} />;
      }
      return <PinCard pin={item as FeedPin} columnWidth={colW} onSavePress={onSavePin} />;
    },
    [colW, onSavePin]
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
          }}
        >
          Loading pins…
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      key={numCols}
      data={gridData}
      numColumns={numCols}
      masonry={true}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      scrollsToTop={scrollsToTop}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        !isLoading && pins.length === 0 && skeletonCount === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: spacing.xl,
              marginTop: 100,
            }}
          >
            <Text
              style={{
                fontFamily: typography.families.heading,
                fontSize: typography.scale.h3,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              {emptyMessage}
            </Text>
          </View>
        ) : null
      }
      ListFooterComponent={
        isLoadingMore ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
      contentContainerStyle={{
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl,
        paddingHorizontal: grid.contentPadding,
      }}
    />
  );
}
