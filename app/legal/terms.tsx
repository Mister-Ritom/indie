import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function TermsScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.xl }}>
      <Text style={{ fontFamily: typography.families.headingBold, fontSize: 32, color: colors.text, marginBottom: spacing.lg }}>
        Terms of Service
      </Text>

      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        Last Updated: {new Date().toLocaleDateString()}
        {"\n\n"}
        Please read these Terms of Service ("Terms", "Terms of Service") carefully before using our application (the "Service", "App"). Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
      </Text>
      
      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        1. Explicit "As Is" and "As Available" Basis
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        The App is provided to you strictly on an "AS IS" and "AS AVAILABLE" basis. The developer makes absolutely no representations or warranties of any kind, express or implied, regarding the operation of the App or the information, content, materials, or products included in the App. You expressly agree that your use of the App is at your sole risk.
      </Text>

      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        2. Zero Liability
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        To the fullest extent permitted by applicable law, in no event will the developer, its affiliates, officers, directors, employees, agents, suppliers or licensors be liable to any person for any indirect, incidental, special, punitive, cover or consequential damages (including, without limitation, damages for lost profits, revenue, sales, goodwill, use of content, impact on business, business interruption, loss of anticipated savings, loss of business opportunity) however caused, under any theory of liability, including, without limitation, contract, tort, warranty, breach of statutory duty, negligence or otherwise. 
        {"\n\n"}
        The developer assumes absolutely zero legal obligations for user actions, content generated, interactions, data loss, database corruption, or anything else that occurs within or as a result of using the App.
      </Text>

      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        3. App Maintenance and Right to Abandon
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        The developer's sole purpose is to maintain the App as a personal project. However, maintenance is entirely at the developer's sole and absolute discretion and may be inconsistent or cease altogether at any moment. 
        {"\n\n"}
        The developer irrevocably reserves the right to abandon, shut down, delete, or suspend the App, its database (hosted via Supabase), and all associated services at any time, for any reason, without prior notice and without any liability whatsoever to you. In the event of abandonment, all user data, pins, and boards may be permanently and irretrievably destroyed.
      </Text>

      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        4. User Content, AI Training, and Advertising
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        You are solely responsible for any content you create, share, or upload. We do not actively monitor user content and accept no responsibility for it. By posting content to the App, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through the Service.
        {"\n\n"}
        **AI Training**: You explicitly acknowledge and consent that any data you generate, including but not limited to pins, boards, and interaction logs, may be used by the developer to train, fine-tune, or improve Artificial Intelligence (AI) models and machine learning algorithms. 
        {"\n\n"}
        **Advertising**: The App integrates third-party ad providers, including AdMob. By using the App, you consent to the display of advertisements, which may be targeted based on your behavior, preferences, and data. Your data may be processed and shared with these ad providers to facilitate personalized advertising and home feed customization.
      </Text>

      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        5. Governing Law and Severability
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        These Terms shall be governed and construed in accordance with the laws of the developer's jurisdiction, without regard to its conflict of law provisions. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
      </Text>
    </ScrollView>
  );
}
