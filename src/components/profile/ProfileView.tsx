import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
import { router } from 'expo-router';
import { Settings, Share as ShareIcon, Plus } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { MasonryGrid } from '@/components/pins/MasonryGrid';
import { formatCount } from '@/utils/formatters';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { ProfileWithStats, FeedPin, Board } from '@/types/database';

interface ProfileViewProps {
  userId: string;
  isCurrentUser: boolean;
}

export function ProfileView({ userId, isCurrentUser }: ProfileViewProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const { user } = useAuthStore();
  
  const [profile, setProfile] = useState<ProfileWithStats | null>(null);
  const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
  const [pins, setPins] = useState<FeedPin[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setIsLoading(true);
      // Fetch profile with basic stats
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (p) {
        // Fetch counts (parallel)
        const [pinsCount, followersCount, followingCount, boardsCount, isFollowing] = await Promise.all([
          supabase.from('pins').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
          supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
          supabase.from('boards').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_private', false),
          user && !isCurrentUser ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', userId).single() : Promise.resolve({ data: null })
        ]);

        if (isMounted) {
          setProfile({
            ...p,
            pins_count: pinsCount.count ?? 0,
            followers_count: followersCount.count ?? 0,
            following_count: followingCount.count ?? 0,
            boards_count: boardsCount.count ?? 0,
            is_following: !!isFollowing.data
          });
        }
      }
      setIsLoading(false);
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [userId, user?.id, isCurrentUser]);

  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      if (activeTab === 'created') {
        const { data } = await supabase
          .from('pins')
          .select('*, profile:user_id(id, username, avatar_url, full_name), assets:pin_assets(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (isMounted) setPins(data ?? []);
      } else {
        const { data } = await supabase
          .from('boards')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (isMounted) setBoards(data ?? []);
      }
    };
    fetchContent();
    return () => { isMounted = false; };
  }, [userId, activeTab]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    const wasFollowing = profile.is_following;
    setProfile(p => p ? { ...p, is_following: !wasFollowing, followers_count: p.followers_count + (wasFollowing ? -1 : 1) } : null);
    
    if (wasFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
    }
  };

  const handleShare = () => {
    if (profile) {
      Share.share({ url: `https://me.ritom.indie/user/${profile.username}`, message: `Check out @${profile.username} on Indie!` });
    }
  };

  if (!profile) return null;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={{ alignItems: 'center', padding: spacing.xl }}>
        <Avatar uri={profile.avatar_url} name={profile.full_name ?? profile.username} size="xl" />
        
        <Text style={{ fontFamily: typography.families.headingBold, fontSize: 28, color: colors.text, marginTop: spacing.md }}>
          {profile.full_name ?? profile.username}
        </Text>
        
        <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginTop: 4 }}>
          @{profile.username}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm }}>
          <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.text }}>
            {formatCount(profile.followers_count)} <Text style={{ color: colors.textSecondary, fontFamily: typography.families.body }}>followers</Text>
          </Text>
          <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.textSecondary }}>·</Text>
          <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.text }}>
            {formatCount(profile.following_count)} <Text style={{ color: colors.textSecondary, fontFamily: typography.families.body }}>following</Text>
          </Text>
        </View>

        {profile.bio && (
          <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.text, textAlign: 'center', marginTop: spacing.md, maxWidth: 400 }}>
            {profile.bio}
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl }}>
          <Button label="Share" variant="secondary" onPress={handleShare} icon={<ShareIcon size={18} color={colors.text} />} />
          
          {isCurrentUser ? (
            <>
              <Button label="Edit Profile" variant="secondary" onPress={() => router.push('/settings/edit-profile')} />
              <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 12, backgroundColor: colors.surface, borderRadius: radius.pill }}>
                <Settings size={22} color={colors.icon} />
              </TouchableOpacity>
            </>
          ) : (
            <Button
              label={profile.is_following ? 'Following' : 'Follow'}
              variant={profile.is_following ? 'secondary' : 'primary'}
              onPress={handleFollow}
            />
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginBottom: spacing.lg }}>
        <TouchableOpacity onPress={() => setActiveTab('created')} style={{ paddingBottom: spacing.sm, borderBottomWidth: 3, borderBottomColor: activeTab === 'created' ? colors.primary : 'transparent' }}>
          <Text style={{ fontFamily: activeTab === 'created' ? typography.families.heading : typography.families.bodyMedium, fontSize: typography.scale.bodyLarge, color: activeTab === 'created' ? colors.text : colors.textSecondary }}>
            Created
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('saved')} style={{ paddingBottom: spacing.sm, borderBottomWidth: 3, borderBottomColor: activeTab === 'saved' ? colors.primary : 'transparent' }}>
          <Text style={{ fontFamily: activeTab === 'saved' ? typography.families.heading : typography.families.bodyMedium, fontSize: typography.scale.bodyLarge, color: activeTab === 'saved' ? colors.text : colors.textSecondary }}>
            Saved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'created' ? (
          <MasonryGrid pins={pins} isLoading={isLoading} emptyMessage="No pins created yet." />
        ) : (
          <View style={{ paddingHorizontal: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {/* Boards Grid */}
            {boards.map(board => (
              <TouchableOpacity
                key={board.id}
                onPress={() => router.push(`/board/${board.id}`)}
                style={{ width: '47%', aspectRatio: 1, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }}
              >
                {/* Simplified Board Card */}
                <View style={{ flex: 1, padding: spacing.md, justifyContent: 'flex-end' }}>
                  <Text style={{ fontFamily: typography.families.headingMedium, fontSize: typography.scale.bodyLarge, color: colors.text }}>{board.name}</Text>
                  {board.is_private && <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.caption, color: colors.textSecondary }}>Private</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
