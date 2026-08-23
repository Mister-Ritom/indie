import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface SkeletonPinCardProps {
  columnWidth: number;
  /** Index 0–n used to vary card height so the masonry grid looks natural */
  index?: number;
}

function ShimmerBlock({
  width,
  height,
  borderRadius,
  shimmerTranslate,
  shimmerColor,
  baseColor,
}: {
  width: number;
  height: number;
  borderRadius: number;
  shimmerTranslate: SharedValue<number>;
  shimmerColor: string;
  baseColor: string;
}) {
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }));

  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: baseColor,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: -width,
            width,
            height,
            backgroundColor: shimmerColor,
          },
          shimmerStyle,
        ]}
      />
    </View>
  );
}

export function SkeletonPinCard({ columnWidth, index = 0 }: SkeletonPinCardProps) {
  const { colors, radius, spacing } = useTheme();

  // Vary height per card for a natural masonry look
  const heightMultipliers = [1.3, 1.0, 1.5, 1.1, 1.25];
  const mult = heightMultipliers[index % heightMultipliers.length];
  const imageHeight = Math.round(columnWidth * mult);

  // Shimmer translation animates across the full card width
  const shimmerTranslate = useSharedValue(-columnWidth);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withSequence(
        withTiming(columnWidth * 2, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-columnWidth, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [columnWidth]);

  const shimmerProps = {
    shimmerColor: colors.skeletonShimmer,
    baseColor: colors.skeleton,
    shimmerTranslate,
  };

  return (
    <View
      style={{
        width: columnWidth,
        marginBottom: spacing.sm,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}
    >
      {/* Image area */}
      <ShimmerBlock
        width={columnWidth}
        height={imageHeight}
        borderRadius={radius.lg}
        {...shimmerProps}
      />

      {/* Footer: title + avatar row */}
      <View
        style={{
          paddingTop: spacing.xs,
          paddingHorizontal: spacing.xs,
          paddingBottom: spacing.sm,
          gap: 6,
        }}
      >
        {/* Title line */}
        <ShimmerBlock
          width={Math.round(columnWidth * 0.7)}
          height={10}
          borderRadius={4}
          {...shimmerProps}
        />
        {/* Avatar + author line */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ShimmerBlock width={20} height={20} borderRadius={10} {...shimmerProps} />
          <ShimmerBlock
            width={Math.round(columnWidth * 0.4)}
            height={8}
            borderRadius={4}
            {...shimmerProps}
          />
        </View>
      </View>
    </View>
  );
}
