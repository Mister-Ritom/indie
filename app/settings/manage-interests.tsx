import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Interest } from '@/types/database';

export default function ManageInterestsScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { user } = useAuthStore();
  
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!user) return;
      const [allRes, userRes] = await Promise.all([
        supabase.from('interests').select('*').order('name'),
        supabase.from('user_interests').select('interest_id').eq('user_id', user.id)
      ]);
      if (isMounted) {
        if (allRes.data) setInterests(allRes.data);
        if (userRes.data) setSelected(new Set(userRes.data.map(i => i.interest_id)));
        setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [user]);

  const toggleInterest = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    // First clear old interests (simple approach)
    await supabase.from('user_interests').delete().eq('user_id', user.id);
    
    if (selected.size > 0) {
      const rows = Array.from(selected).map((id) => ({
        user_id: user.id,
        interest_id: id,
        weight: 1.0,
      }));
      await supabase.from('user_interests').upsert(rows);
    }
    
    setIsSaving(false);
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.families.headingMedium, fontSize: typography.scale.h3, color: colors.text }}>
          Manage Interests
        </Text>
        <Button label="Save" size="sm" onPress={handleSave} isLoading={isSaving} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodyLarge, color: colors.textSecondary, marginBottom: spacing.xl }}>
          Update the topics you care about to tune your feed.
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
    </SafeAreaView>
  );
}
