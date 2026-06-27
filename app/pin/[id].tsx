import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MoreHorizontal, Heart, Share as ShareIcon, ExternalLink, Flag, Ban } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/useTheme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MasonryGrid } from '@/components/pins/MasonryGrid';
import { SaveBoardPicker } from '@/components/pins/SaveBoardPicker';
import { OptionsModal } from '@/components/ui/OptionsModal';
import { ReportModal } from '@/components/ui/ReportModal';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { pickVariant } from '@/utils/imageVariants';
import { timeAgo, formatCount } from '@/utils/formatters';
import type { PinDetail, FeedPin } from '@/types/database';

export default function PinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, radius } = useTheme();
  const { isWeb, width, isLg } = useBreakpoint();
  const { user } = useAuthStore();
  
  const [pin, setPin] = useState<PinDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showSavePicker, setShowSavePicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const hasViewedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPin = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('pins')
        .select(`
          *,
          profile:user_id(id, username, avatar_url, full_name),
          assets:pin_assets(*),
          likes(user_id),
          saves(user_id),
          comments(*, profile:user_id(id, username, avatar_url))
        `)
        .eq('id', id)
        .single();
        
      if (isMounted && !error && data) {
        const pd: PinDetail = {
          ...data,
          likes_count: data.likes?.length ?? 0,
          saves_count: data.saves?.length ?? 0,
          comments_count: data.comments?.length ?? 0,
          is_liked: user ? data.likes?.some((l: any) => l.user_id === user.id) : false,
          is_saved: user ? data.saves?.some((s: any) => s.user_id === user.id) : false,
          comments: data.comments?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) ?? [],
          related_pins: [] // We'd fetch related pins via a separate query based on ai_labels
        };
        setPin(pd);
        setIsLiked(pd.is_liked);
        setLikeCount(pd.likes_count);
        
        // Log view
        if (user && !hasViewedRef.current) {
          hasViewedRef.current = true;
          supabase.from('pin_views').upsert({ user_id: user.id, pin_id: id }).then();
        }

        // Check follow status
        if (user && data.user_id !== user.id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('follower_id', user.id)
            .eq('following_id', data.user_id)
            .single();
          setIsFollowing(!!followData);
        }

        // Fetch related pins (simplified: just matching same interest for now)
        if (data.interest_id) {
          const { data: relatedData } = await supabase
            .from('pins')
            .select('*, profile:user_id(id, username, avatar_url), assets:pin_assets(*)')
            .eq('interest_id', data.interest_id)
            .neq('id', id)
            .limit(20);
          if (isMounted && relatedData) {
            setPin(p => p ? { ...p, related_pins: relatedData as FeedPin[] } : null);
          }
        }
      }
      if (isMounted) setIsLoading(false);
    };
    
    fetchPin();
    return () => { isMounted = false; };
  }, [id, user?.id]);

  const handleLike = async () => {
    if (!user || !pin) return router.push('/(auth)/login');
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount(c => c + (wasLiked ? -1 : 1));
    if (wasLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('pin_id', pin.id);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, pin_id: pin.id });
    }
  };

  const handleFollow = async () => {
    if (!pin) return;
    if (!user) {
      alert("Please log in to follow users.");
      return;
    }
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    
    if (wasFollowing) {
      const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', pin.user_id);
      if (error) console.error("Unfollow error:", error);
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: pin.user_id });
      if (error) console.error("Follow error:", error);
    }
  };

  const handlePostComment = async () => {
    if (!user || !pin || !commentText.trim()) return;
    setIsPostingComment(true);
    const { data } = await supabase
      .from('comments')
      .insert({ pin_id: pin.id, user_id: user.id, text: commentText.trim() })
      .select('*, profile:user_id(id, username, avatar_url)')
      .single();
    
    if (data) {
      setPin(p => p ? { ...p, comments: [data as any, ...p.comments], comments_count: p.comments_count + 1 } : null);
      setCommentText('');
    }
    setIsPostingComment(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!pin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodyLarge, color: colors.textSecondary }}>Pin not found</Text>
      </SafeAreaView>
    );
  }

  // Determine image display size
  const maxImgWidth = isWeb && isLg ? width / 2 : width;
  const variant = pickVariant(pin.assets, isWeb && isLg ? '1440' : '720');
  const aspectRatio = pin.width && pin.height && pin.height > 0 ? pin.width / pin.height : 0.75;
  
  let finalWidth = maxImgWidth;
  let finalHeight = maxImgWidth / aspectRatio;
  
  const MAX_MOBILE_ASPECT = 0.55; // Height is ~1.8x width
  const isExtremelyTall = !isWeb && aspectRatio < MAX_MOBILE_ASPECT;
  const needsExpandOverlay = isExtremelyTall && !isExpanded;
  
  // Only clamp height on large web layouts (where it sits side-by-side with comments).
  if (isWeb && isLg) {
    const maxHeight = 800;
    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = finalHeight * Math.max(aspectRatio, 0.1);
    }
  } else if (needsExpandOverlay) {
    // Clamp to a tall but reasonable height on mobile until expanded
    finalHeight = maxImgWidth / MAX_MOBILE_ASPECT;
  }

  const LayoutWrapper = isWeb && isLg ? View : React.Fragment;
  const layoutProps = isWeb && isLg ? { style: { flexDirection: 'row' as const, flex: 1, height: '100%', alignItems: 'flex-start' as const } } : {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.background, zIndex: 10 }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 8, backgroundColor: colors.surface, borderRadius: radius.pill }}>
            <ArrowLeft size={24} color={colors.icon} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label="Save" onPress={() => setShowSavePicker(true)} size="sm" />
            {user && user.id !== pin.user_id && (
              <TouchableOpacity
                onPress={() => setShowOptions(true)}
                style={{ padding: 10, backgroundColor: colors.surface, borderRadius: radius.pill }}
              >
                <MoreHorizontal size={20} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <LayoutWrapper {...layoutProps}>
            
            {/* Image Column */}
            <View style={{ flex: isWeb && isLg ? 1 : undefined, alignItems: 'center', backgroundColor: isWeb ? colors.surface : 'transparent', borderRadius: isWeb ? radius.xl : 0, overflow: 'hidden', margin: isWeb && isLg ? spacing.lg : 0 }}>
              <View style={{ width: finalWidth, height: finalHeight, backgroundColor: pin.dominant_color ?? colors.skeleton }}>
                {variant ? (
                  <Image 
                    source={{ uri: variant }} 
                    style={{ width: '100%', height: '100%' }} 
                    contentFit={needsExpandOverlay ? "cover" : "cover"} 
                    contentPosition="top center"
                    placeholder={pin.dominant_color ? { uri: pin.dominant_color } : undefined} 
                  />
                ) : null}
                
                {needsExpandOverlay && (
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <LinearGradient
                      colors={['transparent', colors.background]}
                      style={{ position: 'absolute', width: '100%', height: '100%' }}
                    />
                    <TouchableOpacity 
                      onPress={() => setIsExpanded(true)}
                      style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.surface, borderRadius: radius.pill, marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 }}
                    >
                      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.text }}>Tap to expand</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Content Column */}
            <View style={{ flex: isWeb && isLg ? 1 : undefined, padding: spacing.lg, paddingRight: isWeb && isLg ? spacing.xxl : spacing.lg }}>
              
              {/* Actions row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg }}>
                <TouchableOpacity onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Heart size={24} color={isLiked ? colors.primary : colors.icon} fill={isLiked ? colors.primary : 'transparent'} />
                  <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.text }}>{formatCount(likeCount)}</Text>
                </TouchableOpacity>
                {pin.link ? (
                  <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(pin.link!)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ExternalLink size={24} color={colors.icon} />
                    <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.text }}>Visit site</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {pin.title ? <Text style={{ fontFamily: typography.families.headingBold, fontSize: 28, color: colors.text, marginBottom: spacing.sm }}>{pin.title}</Text> : null}
              {pin.description ? <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodyLarge, color: colors.text, marginBottom: spacing.xl }}>{pin.description}</Text> : null}

              {/* Author */}
              <TouchableOpacity onPress={() => router.push(`/user/${pin.profile.username}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl }}>
                <Avatar uri={pin.profile.avatar_url} name={pin.profile.full_name ?? pin.profile.username} size="lg" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.bodyLarge, color: colors.text }}>{pin.profile.full_name ?? pin.profile.username}</Text>
                  <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary }}>@{pin.profile.username}</Text>
                </View>
                {(!user || user.id !== pin.user_id) && (
                  <Button 
                    label={isFollowing ? "Following" : "Follow"} 
                    variant={isFollowing ? "secondary" : "primary"} 
                    size="sm" 
                    onPress={handleFollow} 
                  />
                )}
              </TouchableOpacity>

              {/* Comments */}
              <View style={{ marginTop: spacing.xl }}>
                <Text style={{ fontFamily: typography.families.headingMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.lg }}>
                  Comments ({pin.comments_count})
                </Text>

                <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
                  <Avatar uri={user?.user_metadata?.avatar_url} size="md" />
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: radius.pill, paddingHorizontal: spacing.md }}>
                    <TextInput
                      value={commentText}
                      onChangeText={setCommentText}
                      placeholder="Add a comment"
                      placeholderTextColor={colors.placeholder}
                      style={{ flex: 1, paddingVertical: 12, fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.text, outlineStyle: 'none' } as any}
                      onSubmitEditing={handlePostComment}
                    />
                    {isPostingComment ? (
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: spacing.sm }} />
                    ) : commentText.length > 0 ? (
                      <TouchableOpacity onPress={handlePostComment} style={{ paddingLeft: spacing.sm }}>
                        <Text style={{ fontFamily: typography.families.bodyMedium, color: colors.primary }}>Post</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {pin.comments.map(comment => (
                  <View key={comment.id} style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                    <Avatar uri={comment.profile.avatar_url} name={comment.profile.username} size="sm" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.text }}>
                        <Text style={{ fontFamily: typography.families.bodyBold }}>{comment.profile.username} </Text>
                        {comment.text}
                      </Text>
                      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.caption, color: colors.textSecondary, marginTop: 4 }}>
                        {timeAgo(comment.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

            </View>
          </LayoutWrapper>

          {/* Related Pins */}
          {pin.related_pins.length > 0 && (
            <View style={{ marginTop: spacing.xxl }}>
              <Text style={{ fontFamily: typography.families.headingMedium, fontSize: typography.scale.h2, color: colors.text, textAlign: 'center', marginBottom: spacing.lg }}>
                More to explore
              </Text>
              <MasonryGrid pins={pin.related_pins} />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <SaveBoardPicker visible={showSavePicker} pin={pin} onClose={() => setShowSavePicker(false)} />

      <OptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        items={[
          {
            label: 'Share',
            icon: <ShareIcon size={20} color={colors.icon} />,
            onPress: () => Share.share({ url: `https://me.ritom.indie/pin/${pin.id}`, message: 'Check out this pin on Indie!' }),
          },
          {
            label: 'Report Pin',
            icon: <Flag size={20} color={colors.icon} />,
            onPress: () => setShowReport(true),
          },
          {
            label: 'Block User',
            icon: <Ban size={20} color="#DC2626" />,
            onPress: async () => {
              if (!user) return;
              await supabase.from('user_blocks').insert({ blocker_id: user.id, blocked_id: pin.user_id });
              router.canGoBack() ? router.back() : router.replace('/');
            },
            destructive: true,
          },
        ]}
      />

      <ReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        type="pin"
        targetId={pin.id}
      />
    </SafeAreaView>
  );
}
