/**
 * WebMasonryGrid — web-only masonry with per-card sliding animation.
 *
 * How it works:
 *  1. A "shortest column" greedy algorithm computes an absolute (x, y, w, h)
 *     for every pin given the current column count.
 *  2. Each card is rendered as `position: absolute` with its computed coords.
 *  3. Each card's View carries CSS `transition` on `left`, `top`, and `width`.
 *  4. When the column count changes (sidebar opens/closes or window resizes),
 *     React updates the coords in state and CSS transitions animate every card
 *     to its new position. A diagonal stagger delay (top-left first →
 *     bottom-right last) creates the sweep effect.
 */
import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { PinCard } from "./PinCard";
import { useTheme } from "@/hooks/useTheme";
import type { FeedPin } from "@/types/database";

// ─── Layout constants ────────────────────────────────────────────────────────

const MIN_CARD_WIDTH = 170; // px — minimum column width before reducing columns
const GAP = 8; // px — gap between columns
const PADDING = 16; // px — horizontal padding on both sides

// Footer = padding(8) top + title(~26px) + author-row(~20px) + padding(8) bottom
const FOOTER_HEIGHT = 68;

// Animation
const TRANSITION_MS = 400; // balanced duration
const MAX_STAGGER_MS = 150; // smooth stagger

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface CardLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function numColsForWidth(w: number): number {
  const usable = w - PADDING * 2;
  return Math.max(2, Math.floor((usable + GAP) / (MIN_CARD_WIDTH + GAP)));
}

function colWidthForCols(containerW: number, cols: number): number {
  return Math.floor((containerW - PADDING * 2 - GAP * (cols - 1)) / cols);
}

function buildLayout(
  pins: FeedPin[],
  cols: number,
  colW: number
): { layout: CardLayout[]; totalHeight: number } {
  // colHeights tracks the Y-tip of each column, starting at PADDING
  const colHeights = new Array(cols).fill(PADDING);
  const layout: CardLayout[] = [];

  for (const pin of pins) {
    // Place card in the shortest column
    const col = colHeights.indexOf(Math.min(...colHeights));
    const x = PADDING + col * (colW + GAP);
    const y = colHeights[col];

    // Mirror PinCard's capped aspect-ratio logic
    const ar =
      pin.width && pin.height && pin.height > 0 ? pin.width / pin.height : 0.75;
    const cappedAr = Math.min(Math.max(ar, 0.5), 1.8);
    const imgH = Math.round(colW / cappedAr);
    const cardH = imgH + FOOTER_HEIGHT;

    layout.push({ id: pin.id.toString(), x, y, w: colW, h: cardH });
    colHeights[col] += cardH + GAP;
  }

  const totalHeight = Math.max(...colHeights, PADDING) + PADDING;
  return { layout, totalHeight };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface WebMasonryGridProps {
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
}: WebMasonryGridProps) {
  const { colors, spacing, typography } = useTheme();

  // Measured width of the scroll container — drives column count
  const [containerW, setContainerW] = useState(0);

  // We suppress CSS transitions until after the first layout so cards appear
  // instantly on first render rather than flying in from (0, 0).
  const [transitionsReady, setTransitionsReady] = useState(false);
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cols = containerW > 0 ? numColsForWidth(containerW) : 2;
  const colW =
    containerW > 0 ? colWidthForCols(containerW, cols) : MIN_CARD_WIDTH;

  const { layout, totalHeight } = useMemo(
    () => buildLayout(pins, cols, colW),
    [pins, cols, colW]
  );

  // Fast id → position lookup
  const posMap = useMemo(() => {
    const m = new Map<string, CardLayout>();
    layout.forEach((l) => m.set(l.id, l));
    return m;
  }, [layout]);

  // Enable transitions shortly after first measured layout
  const handleLayout = useCallback(
    (e: any) => {
      const w = e.nativeEvent.layout.width;
      if (w === containerW) return;
      setContainerW(w);

      if (!transitionsReady) {
        // Wait one extra frame so the initial positions are painted before
        // we enable transitions (prevents flying-in effect on page load).
        if (initTimerRef.current) clearTimeout(initTimerRef.current);
        initTimerRef.current = setTimeout(() => setTransitionsReady(true), 120);
      }
    },
    [containerW, transitionsReady]
  );

  useEffect(
    () => () => {
      if (initTimerRef.current) clearTimeout(initTimerRef.current);
    },
    []
  );

  // Infinite scroll
  const handleScroll = useCallback(
    (e: any) => {
      if (!onEndReached) return;
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - contentOffset.y - layoutMeasurement.height;
      if (distanceFromBottom < layoutMeasurement.height * 0.6) {
        onEndReached();
      }
    },
    [onEndReached]
  );

  // ── Loading / empty states ──────────────────────────────────────────────────

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

  if (!isLoading && pins.length === 0) {
    return (
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
    );
  }

  // ── Grid ────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      onLayout={handleLayout}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={150}
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
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
    >
      {ListHeaderComponent}

      {/*
       * Absolutely-positioned masonry canvas.
       * Height is pre-computed so the ScrollView scrolls correctly.
       */}
      <View style={{ position: "relative", height: totalHeight }}>
        {pins.map((pin) => {
          const pos = posMap.get(pin.id.toString());
          if (!pos) return null;

          // ── Stagger: diagonal sweep (top-left → bottom-right) ──────────────
          // Normalise each card's position within the grid [0..1] on both axes,
          // then blend them (70% vertical weight, 30% horizontal) to get a
          // natural reading-order sweep.
          const normY = totalHeight > 0 ? pos.y / totalHeight : 0;
          const normX = containerW > 0 ? pos.x / containerW : 0;
          const staggerMs = transitionsReady
            ? Math.round((normY * 0.7 + normX * 0.3) * MAX_STAGGER_MS)
            : 0;

          return (
            <View
              key={pin.id}
              style={[
                {
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: pos.w,
                },
                // CSS transition props — React Native Web passes these
                // directly to the underlying DOM element's style.
                // @ts-ignore
                transitionsReady && {
                  transitionProperty: "left, top, width",
                  transitionDuration: `${TRANSITION_MS}ms`,
                  // A balanced ease-in-out curve so it doesn't jump instantly at the start
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  transitionDelay: `${staggerMs}ms`,
                },
              ]}
            >
              <PinCard
                pin={pin}
                columnWidth={pos.w}
                onSavePress={onSavePin}
              />
            </View>
          );
        })}
      </View>

      {isLoadingMore && (
        <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </ScrollView>
  );
}
