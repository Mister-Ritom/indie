import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Board, FeedPin } from '@/types/database';
import { useEffect } from 'react';

interface SaveBoardPickerProps {
  visible: boolean;
  pin: FeedPin | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function SaveBoardPicker({ visible, pin, onClose, onSaved }: SaveBoardPickerProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuthStore();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !user) return;
    setIsLoading(true);
    supabase
      .from('boards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBoards(data ?? []);
        setIsLoading(false);
      });
  }, [visible, user]);

  const handleSave = async (boardId: string | null) => {
    if (!user || !pin) return;
    setSaving(boardId ?? 'none');
    await supabase
      .from('saves')
      .upsert({ user_id: user.id, pin_id: pin.id, board_id: boardId });
    setSaving(null);
    onSaved?.();
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Save to board">
      {/* Save without board */}
      <TouchableOpacity
        onPress={() => handleSave(null)}
        style={{
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.text }}>
          Quick save (no board)
        </Text>
        {saving === 'none' && <ActivityIndicator size="small" color={colors.primary} />}
      </TouchableOpacity>

      {/* Create new board */}
      <TouchableOpacity
        onPress={() => {
          onClose();
          router.push('/create/board');
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Plus size={18} color={colors.primary} />
        <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.primary }}>
          Create new board
        </Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.primary} />
      ) : (
        boards.map((board) => (
          <TouchableOpacity
            key={board.id}
            onPress={() => handleSave(board.id)}
            style={{
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.text }}>
                {board.name}
              </Text>
              {board.is_private && (
                <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.caption, color: colors.textSecondary }}>
                  Private
                </Text>
              )}
            </View>
            {saving === board.id && <ActivityIndicator size="small" color={colors.primary} />}
          </TouchableOpacity>
        ))
      )}
    </Modal>
  );
}
