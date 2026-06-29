import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import type { FeedPin } from "@/types/database";

interface DiscoveryCarouselProps {
  pins: FeedPin[];
  isLoading: boolean;
}

export function DiscoveryCarousel({ pins, isLoading }: DiscoveryCarouselProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const { width } = useWindowDimensions();

  // Adjusted width for spacing
  const MAX_CARD_WIDTH = 480;
  const CARD_WIDTH = Math.min(width - spacing.md * 2, MAX_CARD_WIDTH);
  const CARD_HEIGHT = CARD_WIDTH * 1.25;

  // Don't show dots on larger screens
  const SHOW_DOTS_BREAKPOINT = 600;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = e.nativeEvent.layoutMeasurement.width;
    const index = e.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  if (isLoading || pins.length === 0) {
    return (
      <View
        style={{
          height: CARD_HEIGHT,
          marginHorizontal: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <FlatList
        data={pins}
        keyExtractor={(item) => item.id}
        horizontal
        scrollsToTop={false}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: spacing.md }}
        renderItem={({ item }) => {
          const mainAsset =
            item.assets?.find(
              (a) => a.variant === "720" || a.variant === "original",
            ) || item.assets?.[0];

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push(`/pin/${item.id}`)}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginRight: spacing.md,
                borderRadius: radius.xl,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: mainAsset?.url }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
              />

              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "50%",
                  justifyContent: "flex-end",
                  padding: spacing.lg,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.bodySmall,
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: spacing.xs,
                  }}
                >
                  {item.profile?.full_name || item.profile?.username}
                </Text>
                <Text
                  style={{
                    fontFamily: typography.families.heading,
                    fontSize: typography.scale.h2,
                    color: "#fff",
                    lineHeight: typography.scale.h2 * 1.2,
                  }}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
      />

      {/* Pagination Dots */}
      {width < SHOW_DOTS_BREAKPOINT && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: spacing.md,
          }}
        >
          {pins.map((_, index) => (
            <View
              key={index}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index === activeIndex ? colors.text : colors.border,
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
