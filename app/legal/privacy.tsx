import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function PrivacyScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.xl }}>
      <Text style={{ fontFamily: typography.families.headingBold, fontSize: 32, color: colors.text, marginBottom: spacing.lg }}>
        Privacy Policy
      </Text>

      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        Last Updated: {new Date().toLocaleDateString()}
        {"\n\n"}
        This Privacy Policy describes how your personal information is collected, used, and shared when you visit or use our application (the "App"). Please read this Privacy Policy carefully. By using the App, you agree to the collection and use of information in accordance with this policy.
      </Text>
      
      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        1. Information We Collect
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        When you use the App, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the App, we collect information about the individual interactions you make, what boards and pins you view or interact with, and information about how you interact with the App. {"\n\n"}
        Furthermore, we collect any information you explicitly provide to us, which includes, but is not limited to, your email address, username, profile picture, pins created, boards curated, and comments posted.
      </Text>

      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        2. How We Use Your Information
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        We use the Order Information that we collect generally to fulfill any requests placed through the App. Additionally, we use this Information to:
        {"\n"}• Communicate with you;
        {"\n"}• Screen for potential risk or fraud;
        {"\n"}• Provide you with information or advertising relating to our products or services;
        {"\n"}• Personalize your user home feed to show you content, pins, and boards that are relevant to your interests;
        {"\n"}• Train, test, and improve machine learning algorithms and Artificial Intelligence (AI) models. By using the App, you explicitly consent to your data, including pins, boards, and user behaviors, being utilized for AI training and programmatic personalization.
      </Text>

      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        3. Sharing Your Personal Information
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        We share your Personal Information with third parties to help us use your Personal Information, as described above. 
        {"\n\n"}
        **Supabase**: We use Supabase as our backend infrastructure and database provider. All your user data, authentication credentials, pins, and boards are stored on Supabase servers. You can read more about how Supabase uses your Personal Information in their privacy policy.
        {"\n\n"}
        **Ad Providers (AdMob)**: We use Google AdMob and other third-party advertisement networks to serve ads within the App. These third parties may use cookies, web beacons, device identifiers, and other tracking technologies to collect information about your use of the App and other websites and applications. This information is used to provide targeted advertisements, which may be based on your prior interactions with the App or other platforms.
      </Text>
      
      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        4. No Guarantee of Data Security or Retention
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security. This App is provided strictly as a hobby project. We offer ZERO guarantees regarding the security, privacy, or permanence of your data. Data may be lost, corrupted, exposed, or leaked due to bugs, vulnerabilities, server issues, or discontinuation of the service.
      </Text>

      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        5. Right to Abandon and Delete Data
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        The developer maintains the absolute right to abandon the App and its database at any given moment, for any reason, without prior notice. In such an event, your data may be permanently deleted, wiped, or remain inaccessible. We bear absolutely no legal obligation or responsibility to provide data backups, exports, or continued access to the services.
      </Text>

      <Text style={{ fontFamily: typography.families.bodyMedium, fontSize: typography.scale.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>
        6. Consent and Assumption of Risk
      </Text>
      <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.textSecondary, marginBottom: spacing.md }}>
        By continuing to use this App, you acknowledge and agree that you do so entirely at your own risk. You explicitly consent to this lack of data protection guarantees. If you require secure, guaranteed, or permanent data storage, you are instructed to cease use of this App immediately.
      </Text>
    </ScrollView>
  );
}
