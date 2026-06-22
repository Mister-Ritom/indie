import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';
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

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}>
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodyLarge, color: colors.textSecondary }}>
            Update the topics you care about to tune your feed.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {/* Left Column */}
          <View style={{ flex: 1, gap: spacing.md }}>
            {interests.filter((_, i) => i % 2 === 0).map((interest, idx) => {
              const isSelected = selected.has(interest.id);
              const heights = [220, 160, 260, 180, 200];
              const height = heights[idx % heights.length];
              return (
                <TouchableOpacity
                  key={interest.id}
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
              );
            })}
          </View>

          {/* Right Column */}
          <View style={{ flex: 1, gap: spacing.md }}>
            {interests.filter((_, i) => i % 2 !== 0).map((interest, idx) => {
              const isSelected = selected.has(interest.id);
              const heights = [180, 240, 160, 220, 250];
              const height = heights[idx % heights.length];
              return (
                <TouchableOpacity
                  key={interest.id}
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
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
