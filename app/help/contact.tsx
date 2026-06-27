import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ContactSupportScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsSending(true);

    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      Alert.alert(
        "Message Sent",
        "Thank you for contacting support! We will review your message and reply within 24-48 hours.",
        [{ text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace('/') }]
      );
    }, 1500);
  };

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
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
          Contact Support
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl }}>
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.bodyLarge,
              color: colors.textSecondary,
              lineHeight: 22,
              marginBottom: spacing.xl,
            }}
          >
            Have a question, feedback, or encountered a bug? Send us a message and our team will get back to you as soon as possible.
          </Text>

          <View style={{ gap: spacing.lg, marginBottom: spacing.xl }}>
            <Input
              label="Your email address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Subject"
              placeholder="How can we help?"
              value={subject}
              onChangeText={setSubject}
            />

            <Input
              label="Message"
              placeholder="Describe your issue or question in detail..."
              multiline
              numberOfLines={6}
              style={{ height: 120, textAlignVertical: 'top' }}
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <Button
            label="Send Message"
            icon={<Send size={18} color="#fff" style={{ marginRight: spacing.xs }} />}
            onPress={handleSend}
            isLoading={isSending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
