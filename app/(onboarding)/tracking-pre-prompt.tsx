import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { requestTrackingPermission } from '@/utils/tracking';

export default function TrackingPrePromptScreen() {
  const { colors, spacing, typography } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    await requestTrackingPermission();
    setIsLoading(false);
    router.replace('/(tabs)/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
        <ShieldCheck size={64} color={colors.primary} style={{ marginBottom: spacing.lg }} />
        
        <Text style={{ 
          fontFamily: typography.families.headingBold, 
          fontSize: 28, 
          color: colors.text, 
          textAlign: 'center',
          marginBottom: spacing.md 
        }}>
          Personalize Your Experience
        </Text>
        
        <Text style={{ 
          fontFamily: typography.families.body, 
          fontSize: typography.scale.bodyLarge, 
          color: colors.textSecondary, 
          textAlign: 'center',
          marginBottom: spacing.xl,
          lineHeight: 24
        }}>
          Indie uses data to deliver a personalized experience and show you the most relevant content and ads. 
          To do this, we need your permission on the next screen.
        </Text>

        <View style={{ width: '100%', maxWidth: 400, marginTop: spacing.xl }}>
          <Button
            label="Continue"
            onPress={handleContinue}
            isLoading={isLoading}
            size="lg"
            fullWidth
          />
          <TouchableOpacity 
            onPress={() => router.replace('/(tabs)/')}
            style={{ marginTop: spacing.lg, alignItems: 'center', paddingVertical: spacing.sm }}
            disabled={isLoading}
          >
            <Text style={{ 
              fontFamily: typography.families.bodyMedium, 
              fontSize: typography.scale.body, 
              color: colors.textSecondary 
            }}>
              Ask me later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
