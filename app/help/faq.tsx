import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setIsOpen(!isOpen)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: typography.families.bodyMedium,
            fontSize: typography.scale.bodyLarge,
            color: colors.text,
            flex: 1,
            paddingRight: spacing.sm,
          }}
        >
          {question}
        </Text>
        {isOpen ? (
          <ChevronUp size={20} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={colors.textSecondary} />
        )}
      </View>
      {isOpen && (
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            marginTop: spacing.md,
            lineHeight: 20,
          }}
        >
          {answer}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function FAQScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [search, setSearch] = useState('');

  const faqs = [
    {
      question: "What is Indie?",
      answer: "Indie is a creative platform designed for visual discovery, sharing inspiration, and connecting with others through pins and boards. You can explore a wide variety of interests, curate your own mood boards, and share your ideas with a growing community.",
    },
    {
      question: "How do I create a new Pin?",
      answer: "To create a Pin, click the '+' or 'Create' button in the center of the bottom navigation bar on mobile (or the 'Create' menu on desktop). Choose an image, add a title and description, link it to a website if desired, select one of your boards, and click 'Create'.",
    },
    {
      question: "How do I create a Board?",
      answer: "Go to your Profile tab, tap the '+' icon or the settings cog near your board list, and choose 'Create Board'. You can give your board a name, write a short description, and set whether the board should be private (visible only to you) or public.",
    },
    {
      question: "How can I customize my home feed?",
      answer: "Your home feed is curated based on the interests you select. You can update these interests at any time by going to Settings > Manage Interests, and toggling topics like Photography, UI Design, Travel, or Animals to tune your recommendations.",
    },
    {
      question: "Are my private boards visible to others?",
      answer: "No. Any board marked as private is only visible to you. Pins saved within private boards will not appear on your public profile or in general search results for other users.",
    },
    {
      question: "How do I report inappropriate content?",
      answer: "If you come across content that violates our community standards, you can tap on the Pin to open its details, tap the three dots icon (Options), and select 'Report'. Our moderation team reviews all reports within 24 hours.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
  );

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
          Frequently Asked Questions
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl }}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
            height: 48,
            marginBottom: spacing.xl,
          }}
        >
          <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            placeholder="Search FAQs..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              color: colors.text,
            }}
          />
        </View>

        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))
        ) : (
          <View style={{ alignItems: 'center', marginTop: spacing.xxl }}>
            <HelpCircle size={48} color={colors.textSecondary} style={{ marginBottom: spacing.md }} />
            <Text
              style={{
                fontFamily: typography.families.bodyMedium,
                fontSize: typography.scale.bodyLarge,
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              No matching questions found
            </Text>
            <Text
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.body,
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              Try using different keywords or contact support if you need more help.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
