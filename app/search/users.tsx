import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import { UserListItem } from '@/components/profile/UserListItem';

const PAGE_SIZE = 20;

export default function UsersSearchScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const { colors, spacing, typography } = useTheme();

  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      if (!q) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .range(0, PAGE_SIZE - 1);
        
      if (isMounted) {
        if (!error && data) {
          setUsers(data);
          setHasMore(data.length === PAGE_SIZE);
        }
        setIsLoading(false);
      }
    };
    fetchInitial();
    return () => { isMounted = false; };
  }, [q]);

  const fetchMore = async () => {
    if (isLoadingMore || !hasMore || !q) return;
    setIsLoadingMore(true);
    
    const nextPage = page + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .range(from, to);

    if (!error && data) {
      setUsers(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(nextPage);
    }
    setIsLoadingMore(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: typography.families.headingMedium, fontSize: typography.scale.h3, color: colors.text, marginLeft: spacing.md }} numberOfLines={1}>
          Search "{q}"
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlashList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <UserListItem profile={item} />}
            estimatedItemSize={70}
            onEndReached={fetchMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                <Text style={{ fontFamily: typography.families.heading, fontSize: typography.scale.h3, color: colors.textSecondary }}>
                  No users found
                </Text>
              </View>
            }
            ListFooterComponent={
              isLoadingMore ? (
                <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
