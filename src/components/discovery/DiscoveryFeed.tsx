import React from 'react';
import { View, Text } from 'react-native';
import { useDiscoveryCarousel, useFeaturedBoards, useIdeasForYou } from '@/hooks/useDiscovery';
import { DiscoveryCarousel } from './DiscoveryCarousel';
import { FeaturedBoards } from './FeaturedBoards';
import { MasonryGrid } from '../pins/MasonryGrid';
import { useTheme } from '@/hooks/useTheme';
import type { FeedPin } from '@/types/database';

interface DiscoveryFeedProps {
  onSavePin: (pin: FeedPin) => void;
}

export function DiscoveryFeed({ onSavePin }: DiscoveryFeedProps) {
  const { colors, typography, spacing } = useTheme();
  const carousel = useDiscoveryCarousel();
  const featured = useFeaturedBoards();
  const ideas = useIdeasForYou();

  const Header = (
    <View>
      <DiscoveryCarousel pins={carousel.pins} isLoading={carousel.isLoading} />
      <FeaturedBoards boards={featured.boards} isLoading={featured.isLoading} />
      <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
        <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodySmall, color: colors.textSecondary, marginBottom: 4 }}>
          Ideas for you
        </Text>
        <Text style={{ fontFamily: typography.families.heading, fontSize: typography.scale.h3, color: colors.text }}>
          Recommended
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MasonryGrid
        pins={ideas.pins}
        isLoading={ideas.isLoading && ideas.pins.length === 0}
        isRefreshing={ideas.isRefreshing}
        isLoadingMore={ideas.isLoadingMore}
        onRefresh={ideas.refresh}
        onEndReached={ideas.loadMore}
        onSavePin={onSavePin}
        ListHeaderComponent={Header}
      />
    </View>
  );
}
