import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MoreHorizontal, Edit3, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { MasonryGrid } from '@/components/pins/MasonryGrid';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Board, FeedPin } from '@/types/database';

export default function BoardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, radius } = useTheme();
  const { showSidebar } = useBreakpoint();
  const { user } = useAuthStore();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [pins, setPins] = useState<FeedPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchBoard = async () => {
      setIsLoading(true);
      // Load pins via the saves table (board_id column), which captures both
    // pins saved via SaveBoardPicker and pins added during board creation.
    const [boardRes, savesRes] = await Promise.all([
        supabase.from('boards').select('*').eq('id', id).single(),
        supabase
          .from('saves')
          .select('pin:pin_id(*, profile:user_id(id, username, avatar_url, full_name), assets:pin_assets(*))')
          .eq('board_id', id)
          .order('created_at', { ascending: false })
      ]);
      
      if (isMounted) {
        if (boardRes.data) setBoard(boardRes.data);
        if (savesRes.data) {
          // Each save row has shape { pin: PinObject } — unwrap
          const boardPins = savesRes.data
            .map((s: any) => s.pin)
            .filter(Boolean);
          setPins(boardPins);
        }
        setIsLoading(false);
      }
    };
    fetchBoard();
    return () => { isMounted = false; };
  }, [id]);

  const handleDelete = async () => {
    if (!board || board.user_id !== user?.id) return;
    
    // In React Native, Alert is polyfilled for web or uses window.confirm
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('Are you sure you want to delete this board? Pins saved to this board will not be deleted, but they will lose this board categorization.')) return;
    } else {
      // Stub for mobile alert flow if needed
    }

    await supabase.from('boards').delete().eq('id', board.id);
    router.canGoBack() ? router.back() : router.replace('/');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!board) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodyLarge, color: colors.textSecondary }}>Board not found</Text>
      </SafeAreaView>
    );
  }

  const isOwner = user?.id === board.user_id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={showSidebar ? ['top', 'bottom'] : ['top']}>
      {/* Header bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md }}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        
        {isOwner && (
          <TouchableOpacity onPress={() => setShowOptions(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MoreHorizontal size={24} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <MasonryGrid
          pins={pins}
          ListHeaderComponent={
            <View style={{ padding: spacing.xl, paddingBottom: spacing.lg }}>
              <Text style={{ fontFamily: typography.families.headingBold, fontSize: 32, color: colors.text }}>
                {board.name}
              </Text>
              {board.description && (
                <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginTop: spacing.sm }}>
                  {board.description}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.bodySmall, color: colors.textSecondary }}>
                  {pins.length} Pins
                </Text>
                {board.is_private && (
                  <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.bodySmall, color: colors.textSecondary }}>
                    · Private
                  </Text>
                )}
              </View>
            </View>
          }
          emptyMessage="There are no pins on this board yet."
        />
      </View>

      <Modal visible={showOptions} onClose={() => setShowOptions(false)} title="Board options">
        <View style={{ paddingVertical: spacing.md }}>
          <TouchableOpacity
            onPress={handleDelete}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}
          >
            <Trash2 size={20} color={colors.error} />
            <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.error }}>
              Delete board
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
