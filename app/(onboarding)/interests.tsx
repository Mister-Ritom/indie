import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
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
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}>
        <Text style={{ fontFamily: typography.families.headingBold, fontSize: 32, color: colors.text, marginBottom: spacing.xs }}>
          What are you into?
        </Text>
        <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodyLarge, color: colors.textSecondary, marginBottom: spacing.xl }}>
          Pick at least 3 topics to personalize your feed.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {interests.map((interest) => {
            const isSelected = selected.has(interest.id);
            return (
              <TouchableOpacity
                key={interest.id}
                onPress={() => toggleInterest(interest.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.pill,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                {isSelected && <Check size={18} color="#fff" strokeWidth={3} />}
                <Text
                  style={{
                    fontFamily: isSelected ? typography.families.bodyBold : typography.families.bodyMedium,
                    fontSize: typography.scale.body,
                    color: isSelected ? '#fff' : colors.text,
                  }}
                >
                  {interest.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
