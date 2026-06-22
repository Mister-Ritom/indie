import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Interest } from '@/types/database';

export default function InterestsScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { user, profile, setProfile } = useAuthStore();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('interests')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setInterests(data);
        setIsLoading(false);
      });
  }, []);

  const toggleInterest = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = async () => {
    if (!user || selected.size < 3) return;
    setIsSaving(true);
    
    // Insert user interests
    const rows = Array.from(selected).map((id) => ({
      user_id: user.id,
      interest_id: id,
      weight: 1.0,
    }));
    await supabase.from('user_interests').upsert(rows);

    // Mark onboarding complete
    const { data: newProfile } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
      .select()
      .single();
    
    if (newProfile) setProfile(newProfile);
    setIsSaving(false);
    router.replace('/(tabs)/');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <FlashList
          data={interests}
          numColumns={2}
          masonry={true}
          keyExtractor={(item) => item.id}
          estimatedItemSize={200}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{ fontFamily: typography.families.headingBold, fontSize: 32, color: colors.text, marginBottom: spacing.xs }}>
                What are you into?
              </Text>
              <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodyLarge, color: colors.textSecondary }}>
                Pick at least 3 topics to personalize your feed.
              </Text>
            </View>
          }
          renderItem={({ item: interest, index }) => {
            const isSelected = selected.has(interest.id);
            const heights = [220, 160, 260, 180, 200, 180, 240, 160, 220, 250];
            const height = heights[index % heights.length];
            return (
              <View style={{ padding: spacing.md / 2 }}>
                <TouchableOpacity
                  onPress={() => toggleInterest(interest.id)}
                  activeOpacity={0.8}
                  style={{
                    height,
                    borderRadius: radius.lg,
                    overflow: 'hidden',
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : 'transparent',
                  }}
                >
                  <ImageBackground
                    source={{ uri: interest.cover_image_url || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=400' }}
                    style={{ flex: 1 }}
                  >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: spacing.sm }}>
                      {isSelected && (
                        <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: colors.primary, borderRadius: 12, padding: 4 }}>
                          <Check size={16} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                      <Text style={{ fontFamily: typography.families.headingBold, fontSize: 22, color: '#fff', textAlign: 'center' }}>
                        {interest.name}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>

      {/* Bottom bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.md,
          paddingBottom: spacing.xl,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.body, color: colors.textSecondary }}>
          {selected.size} selected
        </Text>
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={selected.size < 3}
          isLoading={isSaving}
        />
      </View>
    </SafeAreaView>
  );
}
