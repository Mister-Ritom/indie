import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, Camera } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { MasonryGrid } from '@/components/pins/MasonryGrid';
import { SaveBoardPicker } from '@/components/pins/SaveBoardPicker';
import { DiscoveryFeed } from '@/components/discovery/DiscoveryFeed';
import { supabase } from '@/lib/supabase/client';
import type { FeedPin } from '@/types/database';

export default function SearchScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { showSidebar } = useBreakpoint();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<FeedPin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingPin, setSavingPin] = useState<FeedPin | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    let isMounted = true;
    const fetchResults = async () => {
      setIsLoading(true);
      // Basic Postgres ILIKE search (in a real app, use Supabase text search or pg_trgm)
      const { data, error } = await supabase
        .from('pins')
        .select('*, profile:user_id(id, username, avatar_url, full_name), assets:pin_assets(*), likes!left(user_id), saves!left(user_id), comments(id)')
        .or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!isMounted) return;
      if (!error && data) {
        // Transform shape to match FeedPin
        const transformed = data.map((d: any) => ({
          ...d,
          likes_count: d.likes?.[0]?.count ?? 0,
          saves_count: d.saves?.[0]?.count ?? 0,
          comments_count: d.comments?.[0]?.count ?? 0,
          is_liked: false, // For simplicity in search results
          is_saved: false,
        }));
        setResults(transformed);
      }
      setIsLoading(false);
    };
    fetchResults();
    return () => { isMounted = false; };
  }, [debouncedQuery]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={showSidebar ? ['top', 'bottom'] : ['top']}
    >
      <View style={{ padding: spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBg,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.md,
            height: 48,
          }}
        >
          <SearchIcon size={20} color={colors.iconMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for ideas"
            placeholderTextColor={colors.placeholder}
            style={{
              flex: 1,
              marginLeft: spacing.sm,
              fontFamily: typography.families.body,
              fontSize: typography.scale.bodyLarge,
              color: colors.text,
              outlineStyle: 'none',
            } as any}
            autoFocus={false}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={20} color={colors.icon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => {}}>
              <Camera size={20} color={colors.iconMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {!debouncedQuery ? (
          <DiscoveryFeed onSavePin={setSavingPin} />
        ) : (
          <MasonryGrid
            pins={results}
            isLoading={isLoading}
            onSavePin={setSavingPin}
            emptyMessage={`No results found for "${debouncedQuery}"`}
          />
        )}
      </View>

      <SaveBoardPicker
        visible={!!savingPin}
        pin={savingPin}
        onClose={() => setSavingPin(null)}
      />
    </SafeAreaView>
  );
}
