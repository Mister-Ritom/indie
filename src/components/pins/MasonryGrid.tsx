import React, { useCallback } from "react";
import {
  View,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
// 💡 Back to the standard FlashList import for v2.x
import { FlashList } from "@shopify/flash-list";
import { PinCard } from "./PinCard";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { columnWidth } from "@/utils/imageVariants";
import type { FeedPin } from "@/types/database";

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
}: MasonryGridProps) {
  const { colors, spacing, typography } = useTheme();
  const { width } = useWindowDimensions();
  const { masonryCols, showSidebar, grid } = useBreakpoint();

  // Account for sidebar width on web
  const contentWidth = showSidebar ? width - grid.sidebarWidth : width;
  const colW = columnWidth(
    contentWidth,
    masonryCols,
    grid.gap,
    grid.contentPadding,
  );

  // Memorize the render item function for performance
  const renderItem = useCallback(
    ({ item }: { item: FeedPin }) => (
      <PinCard pin={item} columnWidth={colW} onSavePress={onSavePin} />
    ),
    [colW, onSavePin],
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
      data={pins}
      numColumns={masonryCols}
      masonry={true} // 💡 The magic switch for FlashList v2!
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
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        !isLoading && pins.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: spacing.xl,
              marginTop: 100, // Push it down towards center
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
