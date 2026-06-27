import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Users } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';
import { AddPinsModal } from '@/components/board/AddPinsModal';

// ------------------------------------------------------------------
// BoardCoverSilhouette
// Shows 3 panes in mixed orientations (portrait left, landscape top-right,
// square bottom-right), matching Pinterest's board creation silhouette.
// ------------------------------------------------------------------
interface BoardCoverProps {
  pins: string[]; // array of public image URLs (up to 3)
  onPress: () => void;
  colors: any;
  radius: any;
}

function BoardCoverSilhouette({ pins, onPress, colors, radius }: BoardCoverProps) {
  const COVER_HEIGHT = 200;
  const PANE_COLOR = colors.surface;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View
        style={{
          height: COVER_HEIGHT,
          borderRadius: radius.xl,
          overflow: 'hidden',
          flexDirection: 'row',
          gap: 2,
          backgroundColor: colors.border,
        }}
      >
        {/* Left pane: tall portrait */}
        <View style={{ flex: 1, backgroundColor: PANE_COLOR, overflow: 'hidden' }}>
          {pins[0] ? (
            <Image source={{ uri: pins[0] }} style={{ flex: 1, width: '100%' }} resizeMode="cover" />
          ) : null}
        </View>

        {/* Right column: two stacked panes */}
        <View style={{ flex: 0.8, flexDirection: 'column', gap: 2 }}>
          {/* Top-right: landscape orientation */}
          <View style={{ flex: 0.6, backgroundColor: PANE_COLOR, overflow: 'hidden' }}>
            {pins[1] ? (
              <Image source={{ uri: pins[1] }} style={{ flex: 1, width: '100%' }} resizeMode="cover" />
            ) : null}
          </View>
          {/* Bottom-right: rotated / square */}
          <View style={{ flex: 0.4, backgroundColor: PANE_COLOR, overflow: 'hidden' }}>
            {pins[2] ? (
              <Image source={{ uri: pins[2] }} style={{ flex: 1, width: '100%' }} resizeMode="cover" />
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ------------------------------------------------------------------
// Row component for settings rows (secret / group board)
// ------------------------------------------------------------------
function SettingsRow({
  title,
  subtitle,
  right,
  onPress,
  colors,
  typography,
  spacing,
}: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.caption, color: colors.textSecondary, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      {right}
    </TouchableOpacity>
  );
}

// ------------------------------------------------------------------
// Main screen
// ------------------------------------------------------------------
export default function CreateBoardScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { user } = useAuthStore();

  const [boardName, setBoardName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Selected pin IDs + their preview URLs
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>([]);
  const [selectedPinUrls, setSelectedPinUrls] = useState<string[]>([]);

  // Modal visibility
  const [showAddPins, setShowAddPins] = useState(false);
  // Whether we're waiting to show AddPins after board creation
  const [pendingAddPins, setPendingAddPins] = useState(false);
  const [pendingBoardId, setPendingBoardId] = useState<string | null>(null);

  const canCreate = boardName.trim().length > 0;

  const handleAddPinsDone = useCallback(
    async (pinIds: string[], pinUrls: string[]) => {
      setSelectedPinIds(pinIds);
      setSelectedPinUrls(pinUrls);
      setShowAddPins(false);

      // If we were in the "create then add" flow, save pins now
      if (pendingBoardId && pinIds.length > 0) {
        await savePinsToBoard(pendingBoardId, pinIds);
        setPendingBoardId(null);
        setPendingAddPins(false);
        router.canGoBack() ? router.back() : router.replace('/');
        setTimeout(() => {
          router.push(`/board/${pendingBoardId}`);
        }, 150);
      } else if (pendingBoardId) {
        // No pins chosen after prompt — just go to board
        setPendingBoardId(null);
        setPendingAddPins(false);
        router.canGoBack() ? router.back() : router.replace('/');
        setTimeout(() => {
          router.push(`/board/${pendingBoardId}`);
        }, 150);
      }
    },
    [pendingBoardId]
  );

  const savePinsToBoard = async (boardId: string, pinIds: string[]) => {
    if (!user || pinIds.length === 0) return;
    const rows = pinIds.map((pin_id) => ({
      user_id: user.id,
      pin_id,
      board_id: boardId,
    }));
    await supabase.from('saves').upsert(rows, { onConflict: 'user_id,pin_id' });
  };

  const handleCreate = async () => {
    if (!canCreate || !user || isCreating) return;
    setIsCreating(true);

    try {
      const { data: board, error } = await supabase
        .from('boards')
        .insert({
          user_id: user.id,
          name: boardName.trim(),
          is_private: isPrivate,
        })
        .select()
        .single();

      if (error || !board) throw error ?? new Error('Board creation failed');

      if (selectedPinIds.length > 0) {
        // Pins already chosen — save them and navigate
        await savePinsToBoard(board.id, selectedPinIds);
        router.canGoBack() ? router.back() : router.replace('/');
        setTimeout(() => {
          router.push(`/board/${board.id}`);
        }, 150);
      } else {
        // No pins chosen yet — show AddPins modal, then navigate
        setPendingBoardId(board.id);
        setPendingAddPins(true);
        setShowAddPins(true);
      }
    } catch (e: any) {
      alert(e?.message ?? 'Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={{ fontFamily: typography.families.heading, fontSize: typography.scale.bodyLarge, color: colors.text }}>
            Create a board
          </Text>
          {/* Spacer to center title */}
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          {/* Cover silhouette */}
          <BoardCoverSilhouette
            pins={selectedPinUrls}
            onPress={() => setShowAddPins(true)}
            colors={colors}
            radius={radius}
          />

          {/* Board name input */}
          <View
            style={{
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: radius.lg,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm,
              paddingBottom: spacing.md,
              backgroundColor: colors.inputBg,
            }}
          >
            <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.caption, color: colors.textSecondary, marginBottom: 4 }}>
              Board name
            </Text>
            <TextInput
              value={boardName}
              onChangeText={setBoardName}
              placeholder="Name your board"
              placeholderTextColor={colors.placeholder}
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.bodyLarge,
                color: colors.text,
                padding: 0,
                ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
              }}
              maxLength={50}
              autoFocus
            />
          </View>

          {/* Settings rows */}
          <View>
            <SettingsRow
              title="Make this board secret"
              subtitle="Only you and collaborators will see this board"
              right={
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              }
              colors={colors}
              typography={typography}
              spacing={spacing}
            />
            <SettingsRow
              title="Group board"
              subtitle="Invite collaborators to join this board"
              right={
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} color={colors.textSecondary} />
                </View>
              }
              onPress={() => alert('Coming soon!')}
              colors={colors}
              typography={typography}
              spacing={spacing}
            />
          </View>
        </ScrollView>

        {/* Footer create button */}
        <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!canCreate || isCreating}
            style={{
              backgroundColor: canCreate ? colors.text : colors.surface,
              borderRadius: radius.pill,
              paddingVertical: spacing.md + 2,
              alignItems: 'center',
              opacity: isCreating ? 0.7 : 1,
            }}
          >
            {isCreating ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: canCreate ? colors.background : colors.textTertiary }}>
                Create board
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Add Pins full-screen modal */}
      <AddPinsModal
        visible={showAddPins}
        onClose={() => {
          setShowAddPins(false);
          // If we were in the pending flow and user dismissed, still navigate
          if (pendingBoardId) {
            const bid = pendingBoardId;
            setPendingBoardId(null);
            setPendingAddPins(false);
            router.canGoBack() ? router.back() : router.replace('/');
            setTimeout(() => {
              router.push(`/board/${bid}`);
            }, 150);
          }
        }}
        onDone={handleAddPinsDone}
        initialSelected={selectedPinIds}
      />
    </SafeAreaView>
  );
}
