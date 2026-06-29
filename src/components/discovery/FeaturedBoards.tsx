import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import type { BoardWithPins } from '@/types/database';

const { width } = Dimensions.get('window');

interface FeaturedBoardsProps {
  boards: BoardWithPins[];
  isLoading: boolean;
}

export function FeaturedBoards({ boards, isLoading }: FeaturedBoardsProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const router = useRouter();

  const CARD_WIDTH = width * 0.65;
  const CARD_HEIGHT = CARD_WIDTH * 0.8;

  if (isLoading || boards.length === 0) return null;

  const renderMosaic = (board: BoardWithPins) => {
    const pins = board.pins.slice(0, 3);
    const getUrl = (pin: any) => pin?.assets?.[0]?.url;

    if (pins.length === 0) {
      return <View style={{ flex: 1, backgroundColor: colors.surface }} />;
    }

    if (pins.length === 1) {
      return (
        <Image
          source={{ uri: getUrl(pins[0]) }}
          style={{ flex: 1 }}
          contentFit="cover"
        />
      );
    }

    if (pins.length === 2) {
      return (
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <Image source={{ uri: getUrl(pins[0]) }} style={{ flex: 1 }} contentFit="cover" />
          <Image source={{ uri: getUrl(pins[1]) }} style={{ flex: 1 }} contentFit="cover" />
        </View>
      );
    }

    return (
      <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
        <Image source={{ uri: getUrl(pins[0]) }} style={{ flex: 2 }} contentFit="cover" />
        <View style={{ flex: 1, gap: 2 }}>
          <Image source={{ uri: getUrl(pins[1]) }} style={{ flex: 1 }} contentFit="cover" />
          <Image source={{ uri: getUrl(pins[2]) }} style={{ flex: 1 }} contentFit="cover" />
        </View>
      </View>
    );
  };

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text 
        style={{ 
          fontFamily: typography.families.body, 
          fontSize: typography.scale.bodySmall, 
          color: colors.textSecondary,
          paddingHorizontal: spacing.md,
          marginBottom: 4 
        }}
      >
        Explore featured boards
      </Text>
      <Text 
        style={{ 
          fontFamily: typography.families.heading, 
          fontSize: typography.scale.h3, 
          color: colors.text,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.md 
        }}
      >
        Ideas you might like
      </Text>

      <FlatList
        data={boards}
        keyExtractor={(item) => item.id}
        horizontal
        scrollsToTop={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + spacing.md}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: spacing.md }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => router.push(`/board/${item.id}`)}
            style={{ width: CARD_WIDTH, marginRight: spacing.md }}
          >
            <View 
              style={{ 
                height: CARD_HEIGHT, 
                borderRadius: radius.xl, 
                overflow: 'hidden',
                backgroundColor: colors.surface,
                marginBottom: spacing.sm,
              }}
            >
              {renderMosaic(item)}
            </View>
            <Text 
              style={{ 
                fontFamily: typography.families.bodyMedium, 
                fontSize: typography.scale.bodyLarge, 
                color: colors.text 
              }}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
              {item.pins_count > 0 && (
                <Text style={{ fontSize: typography.scale.bodySmall, color: colors.textSecondary }}>
                  {item.pins_count} Pins · 
                </Text>
              )}
              <Text style={{ fontSize: typography.scale.bodySmall, color: colors.textSecondary, marginLeft: 4 }} numberOfLines={1}>
                {item.profile?.full_name || item.profile?.username}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
