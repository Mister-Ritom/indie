import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MasonryGrid } from '@/components/pins/MasonryGrid';
import { SaveBoardPicker } from '@/components/pins/SaveBoardPicker';
import { useFeed } from '@/hooks/useFeed';
import { useTheme } from '@/hooks/useTheme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { FeedPin } from '@/types/database';

export default function HomeFeedScreen() {
  const { colors, spacing } = useTheme();
  const { showSidebar } = useBreakpoint();
  const {
    pins,
    isLoading,
    isRefreshing,
    isLoadingMore,
    refresh,
    loadMore,
  } = useFeed();

  const [savingPin, setSavingPin] = useState<FeedPin | null>(null);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={showSidebar ? ['top', 'bottom'] : ['top']}
    >
      <View style={{ flex: 1, paddingTop: showSidebar ? spacing.md : 0 }}>
        <MasonryGrid
          pins={pins}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          isLoadingMore={isLoadingMore}
          onRefresh={refresh}
          onEndReached={loadMore}
          onSavePin={setSavingPin}
          emptyMessage="Your feed is empty. Follow some boards or interests!"
        />
      </View>

      <SaveBoardPicker
        visible={!!savingPin}
        pin={savingPin}
        onClose={() => setSavingPin(null)}
      />
    </SafeAreaView>
  );
}
