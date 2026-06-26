import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Compass, FolderPlus, Heart } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function GettingStartedScreen() {
  const { colors, spacing, typography, radius } = useTheme();

  const steps = [
    {
      title: "1. Complete Your Profile",
      description: "Set a unique username, update your display name, upload a custom avatar, and write a short bio to introduce yourself to the community. A complete profile makes it easier for other creators to find and follow you.",
      icon: <User size={24} color={colors.primary} />,
    },
    {
      title: "2. Select Your Interests",
      description: "Choose from a curated list of topics (like Photography, UI Design, Art, Nature) to personalize your feed. You can adjust these at any time under Settings to tune your feed recommendations.",
      icon: <Compass size={24} color={colors.primary} />,
    },
    {
      title: "3. Create Your First Board",
      description: "Boards are collections where you organize your pins. Create public boards to share with the community, or private boards to keep your inspiration to yourself. Group them by themes like 'Living Room Ideas' or 'UI Design Inspiration'.",
      icon: <FolderPlus size={24} color={colors.primary} />,
    },
    {
      title: "4. Save and Upload Pins",
      description: "Discover pins created by other users and save them to your boards, or click the '+' button to upload your own images and share your creativity with the world.",
      icon: <Heart size={24} color={colors.primary} />,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: typography.families.headingMedium,
            fontSize: typography.scale.h3,
            color: colors.text,
            marginLeft: spacing.md,
          }}
        >
          Getting Started Guide
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl }}>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.bodyLarge,
            color: colors.textSecondary,
            lineHeight: 24,
            marginBottom: spacing.xl,
          }}
        >
          Welcome to Indie! This guide will walk you through the essential steps to get started with curating and sharing visual ideas.
        </Text>

        {steps.map((step, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              alignItems: 'flex-start',
              gap: spacing.md,
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                padding: spacing.sm,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {step.icon}
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: typography.families.headingMedium,
                  fontSize: typography.scale.bodyLarge,
                  color: colors.text,
                  marginBottom: spacing.xs,
                }}
              >
                {step.title}
              </Text>
              <Text
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.body,
                  color: colors.textSecondary,
                  lineHeight: 20,
                }}
              >
                {step.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
