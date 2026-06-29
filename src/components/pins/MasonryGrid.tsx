import React, { useCallback } from "react";
import {
  View,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { PinCard } from "./PinCard";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { columnWidth } from "@/utils/imageVariants";
import type { FeedPin } from "@/types/database";
import { useSidebarStore } from "@/stores/sidebarStore";

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

  const renderItem = useCallback(
    ({ item }: { item: FeedPin }) => (
      <PinCard pin={item} columnWidth={colW} onSavePress={onSavePin} />
    ),
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
      data={pins}
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
        !isLoading && pins.length === 0 ? (
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
