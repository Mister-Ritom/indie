import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';
import { pickVariant } from '@/utils/imageVariants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLS = 2;
const GAP = 2;
const CELL_SIZE = (SCREEN_WIDTH - GAP * (NUM_COLS + 1)) / NUM_COLS;

interface PinItem {
  id: string;
  imageUrl: string;
  title?: string;
}

interface AddPinsModalProps {
  visible: boolean;
  onClose: () => void;
  onDone: (selectedPinIds: string[], selectedPinUrls: string[]) => void;
  initialSelected?: string[];
}

export function AddPinsModal({ visible, onClose, onDone, initialSelected = [] }: AddPinsModalProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const { user } = useAuthStore();

  const [pins, setPins] = useState<PinItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  // Reset selection when modal opens
  useEffect(() => {
    if (visible) {
      setSelected(new Set(initialSelected));
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !user) return;
    setIsLoading(true);

    const fetchPins = async () => {
      const resolveUrl = (pin: any, assets: any[]) => {
        const url = pickVariant(assets || [], '360');
        if (url) return url;
        // Fallback if Edge function hasn't processed variants yet
        return supabase.storage.from('pin-originals').getPublicUrl(`${pin.user_id}/${pin.id}`).data.publicUrl;
      };

      // Run both fetches in parallel
      const [feedResult, ownResult] = await Promise.all([
        // Feed pins via RPC (follows + discovery), same as home feed
        supabase.rpc('get_feed_pins', {
          viewer_id: user.id,
          page_limit: 60,
          page_offset: 0,
        }),
        // User's own created pins (not returned by feed RPC since it excludes self)
        supabase
          .from('pins')
          .select('id, title, user_id, assets:pin_assets(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(40),
      ]);

      const allPins: PinItem[] = [];
      const seenIds = new Set<string>();

      // 1. Own pins first (they appear at the top)
      (ownResult.data ?? []).forEach((p: any) => {
        if (seenIds.has(p.id)) return;
        const url = resolveUrl(p, p.assets ?? []);
        if (url) {
          allPins.push({ id: p.id, imageUrl: url, title: p.title });
          seenIds.add(p.id);
        }
      });

      // 2. Feed pin IDs from RPC — then fetch full pin data including assets
      const feedIds = (feedResult.data ?? []).map((f: any) => f.id);
      if (feedIds.length > 0) {
        const { data: feedPinsData } = await supabase
          .from('pins')
          .select('id, title, user_id, assets:pin_assets(*)')
          .in('id', feedIds);

        // Restore RPC score order
        const orderedFeed = feedIds
          .map((id: string) => feedPinsData?.find((p: any) => p.id === id))
          .filter(Boolean);

        orderedFeed.forEach((p: any) => {
          if (seenIds.has(p.id)) return;
          const url = resolveUrl(p, p.assets ?? []);
          if (url) {
            allPins.push({ id: p.id, imageUrl: url, title: p.title });
            seenIds.add(p.id);
          }
        });
      }

      setPins(allPins);
      setIsLoading(false);
    };

    fetchPins();
  }, [visible, user]);

  const togglePin = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDone = () => {
    const selectedIds = Array.from(selected);
    const selectedUrls = selectedIds
      .map((id) => pins.find((p) => p.id === id)?.imageUrl)
      .filter(Boolean) as string[];
    onDone(selectedIds, selectedUrls);
  };

  const renderItem = ({ item }: { item: PinItem }) => {
    const isSelected = selected.has(item.id);
    return (
      <TouchableOpacity
        onPress={() => togglePin(item.id)}
        activeOpacity={0.85}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE * 1.25,
          margin: GAP / 2,
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.surface,
        }}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {isSelected && (
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.35)',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: spacing.sm,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={16} color="#fff" strokeWidth={3} />
            </View>
          </View>
        )}
        {!isSelected && (
          <View
            style={{
              position: 'absolute',
              bottom: spacing.sm,
              right: spacing.sm,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.6)',
            }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={{ fontFamily: typography.families.heading, fontSize: typography.scale.bodyLarge, color: colors.text }}>
            Add Pins
          </Text>
          <TouchableOpacity
            onPress={handleDone}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
            }}
          >
            <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: '#fff' }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : pins.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
            <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.bodyLarge, color: colors.textSecondary, textAlign: 'center' }}>
              No pins yet. Create some pins first!
            </Text>
          </View>
        ) : (
          <FlatList
            data={pins}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLS}
            contentContainerStyle={{ padding: GAP / 2 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
