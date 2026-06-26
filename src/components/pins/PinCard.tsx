import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreHorizontal, Bookmark, Share2, Flag, Ban } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { OptionsModal } from '@/components/ui/OptionsModal';
import { ReportModal } from '@/components/ui/ReportModal';
import { SaveBoardPicker } from '@/components/pins/SaveBoardPicker';
import { pickVariant, variantForWidth } from '@/utils/imageVariants';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { FeedPin } from '@/types/database';

interface PinCardProps {
  pin: FeedPin;
  columnWidth: number;
  onSavePress?: (pin: FeedPin) => void;
}

export function PinCard({ pin, columnWidth, onSavePress }: PinCardProps) {
  const { colors, radius, spacing, typography, shadows } = useTheme();
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(pin.is_liked);
  const [likeCount, setLikeCount] = useState(pin.likes_count);
  const [showActions, setShowActions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSavePicker, setShowSavePicker] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Calculate image height to preserve aspect ratio
  const aspectRatio =
    pin.width && pin.height && pin.height > 0 ? pin.width / pin.height : 0.75;
  const imageHeight = Math.round(columnWidth / aspectRatio);
  const cappedHeight = Math.min(Math.max(imageHeight, columnWidth * 0.5), columnWidth * 1.8);

  const variant = variantForWidth(columnWidth);
  const imageUrl = pickVariant(pin.assets ?? [], variant);

  // Heart animation
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  // Hover elevation (web only)
  const cardElevation = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardElevation.value }],
  }));

  const handleLike = useCallback(async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    heartScale.value = withSpring(1.4, {}, () => {
      heartScale.value = withSpring(1);
    });
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    if (wasLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('pin_id', pin.id);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, pin_id: pin.id });
    }
  }, [user, isLiked, pin.id]);

  const handleCardPress = useCallback(() => {
    router.push(`/pin/${pin.id}`);
  }, [pin.id]);

  const handleAuthorPress = useCallback(() => {
    router.push(`/user/${pin.profile?.username}`);
  }, [pin.profile?.username]);

  const handleLongPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowOptions(true);
    }
  }, []);

  const handleBlockUser = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('user_blocks')
      .insert({ blocker_id: user.id, blocked_id: pin.user_id });
    if (!error) {
      setIsHidden(true);
    }
  }, [user, pin.user_id]);

  const handleShare = useCallback(() => {
    Share.share({
      url: `https://me.ritom.indie/pin/${pin.id}`,
      message: `Check out this pin on Indie!`,
    });
  }, [pin.id]);

  const optionItems = [
    {
      label: 'Save',
      icon: <Bookmark size={20} color={colors.icon} />,
      onPress: () => setShowSavePicker(true),
    },
    {
      label: 'Share',
      icon: <Share2 size={20} color={colors.icon} />,
      onPress: handleShare,
    },
    ...(user && user.id !== pin.user_id
      ? [
          {
            label: 'Report Pin',
            icon: <Flag size={20} color={colors.icon} />,
            onPress: () => setShowReport(true),
          },
          {
            label: 'Block User',
            icon: <Ban size={20} color="#DC2626" />,
            onPress: handleBlockUser,
            destructive: true,
          },
        ]
      : []),
  ];

  if (isHidden) return null;

  return (
    <>
      <Animated.View
        style={[
          cardStyle,
          {
            width: columnWidth,
            marginBottom: spacing.sm,
            borderRadius: radius.lg,
            overflow: 'hidden',
            backgroundColor: 'transparent',
          },
        ]}
        {...(Platform.OS === 'web'
          ? {
              onMouseEnter: () => {
                cardElevation.value = withTiming(-4, { duration: 200 });
                setShowActions(true);
              },
              onMouseLeave: () => {
                cardElevation.value = withTiming(0, { duration: 200 });
                setShowActions(false);
              },
            }
          : {})}
      >
        <Pressable
          onPress={handleCardPress}
          onLongPress={handleLongPress}
          delayLongPress={400}
          style={{ borderRadius: radius.lg, overflow: 'hidden' }}
        >
          {/* Image + dominant color placeholder */}
          <View
            style={{
              width: columnWidth,
              height: cappedHeight,
              backgroundColor: pin.dominant_color ?? colors.skeleton,
              borderRadius: radius.lg,
              overflow: 'hidden',
            }}
          >
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: columnWidth, height: cappedHeight }}
                contentFit="cover"
                contentPosition="top center"
                transition={300}
                placeholder={pin.dominant_color ? { uri: pin.dominant_color } : undefined}
                recyclingKey={pin.id}
              />
            )}

            {/* Web hover action overlay */}
            {showActions && Platform.OS === 'web' && (
              <View
                style={{
                  position: 'absolute',
                  top: spacing.sm,
                  right: spacing.sm,
                  gap: spacing.xs,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {/* Save button */}
                <TouchableOpacity
                  onPress={() => onSavePress?.(pin)}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: radius.pill,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontFamily: typography.families.bodyBold,
                      fontSize: typography.scale.caption,
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>

                {/* Three-dot options button */}
                <TouchableOpacity
                  onPress={() => setShowOptions(true)}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    borderRadius: radius.pill,
                    width: 34,
                    height: 34,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MoreHorizontal size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Card footer */}
          <View
            style={{
              padding: spacing.sm,
              paddingHorizontal: spacing.sm + 2,
            }}
          >
            {pin.title ? (
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: typography.families.bodyMedium,
                  fontSize: typography.scale.bodySmall,
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                {pin.title}
              </Text>
            ) : null}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 2,
              }}
            >
              {/* Author */}
              <TouchableOpacity
                onPress={handleAuthorPress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}
                activeOpacity={0.7}
              >
                <Avatar
                  uri={pin.profile?.avatar_url}
                  name={pin.profile?.full_name ?? pin.profile?.username}
                  size="xs"
                />
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: typography.families.body,
                    fontSize: typography.scale.caption,
                    color: colors.textSecondary,
                    flex: 1,
                  }}
                >
                  {pin.profile?.username}
                </Text>
              </TouchableOpacity>

              {/* Like button */}
              <Animated.View style={heartStyle}>
                <TouchableOpacity onPress={handleLike} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Heart
                    size={16}
                    color={isLiked ? colors.primary : colors.iconMuted}
                    fill={isLiked ? colors.primary : 'transparent'}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Options Modal */}
      <OptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        items={optionItems}
      />

      {/* Report Modal */}
      <ReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        type="pin"
        targetId={pin.id}
      />

      {/* Save Board Picker */}
      <SaveBoardPicker
        visible={showSavePicker}
        pin={pin}
        onClose={() => setShowSavePicker(false)}
      />
    </>
  );
}
