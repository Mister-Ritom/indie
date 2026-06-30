import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  Trash2,
  Clock,
  Pin,
  LayoutGrid,
  MessageCircle,
  User,
  Bell,
  Users,
  RefreshCw,
  Mail,
  BarChart2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CalendarClock,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

// ─── types ───────────────────────────────────────────────────────────────────

type Step = "overview" | "what-happens" | "confirm";

const CONFIRM_PHRASE = "delete my account";

const DELETED_ITEMS = [
  { Icon: Pin, label: "All your pins", detail: "Every pin you've created" },
  { Icon: LayoutGrid, label: "All your boards", detail: "Public and private" },
  {
    Icon: MessageCircle,
    label: "Comments & likes",
    detail: "Your entire activity history",
  },
  { Icon: User, label: "Your profile", detail: "Username, bio, avatar" },
  { Icon: Bell, label: "Notifications", detail: "All notification history" },
  { Icon: Users, label: "Follows", detail: "Followers and following lists" },
];

const KEPT_ITEMS = [
  {
    Icon: RefreshCw,
    label: "Re-saves by others",
    detail: "If someone saved your pin to their board, that copy stays",
  },
  {
    Icon: Mail,
    label: "Support correspondence",
    detail: "Any emails or tickets submitted to our team",
  },
  {
    Icon: BarChart2,
    label: "Anonymised analytics",
    detail: "Aggregate stats with no link to your identity",
  },
];

// ─── shared sub-components ───────────────────────────────────────────────────

function SectionLabel({ label, colors, typography, spacing }: any) {
  return (
    <Text
      style={{
        fontFamily: typography.families.body,
        fontSize: typography.scale.caption,
        fontWeight: "700",
        color: colors.iconMuted,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: spacing.sm,
      }}
    >
      {label}
    </Text>
  );
}

function ListItem({
  Icon,
  label,
  detail,
  variant = "deleted",
  colors,
  typography,
  spacing,
  radius,
}: any) {
  const isDanger = variant === "deleted";
  const iconBg = isDanger ? colors.error + "15" : colors.success + "15";
  const iconColor = isDanger ? colors.error : colors.success;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.bodySmall,
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.caption,
            color: colors.textSecondary,
            lineHeight: 18,
          }}
        >
          {detail}
        </Text>
      </View>
    </View>
  );
}

function ProgressBar({ step, colors }: { step: Step; colors: any }) {
  const steps: Step[] = ["overview", "what-happens", "confirm"];
  const idx = steps.indexOf(step);
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 4,
        paddingHorizontal: 20,
        paddingBottom: 12,
      }}
    >
      {steps.map((s, i) => (
        <View
          key={s}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: i <= idx ? colors.error : colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── step 1: overview ────────────────────────────────────────────────────────

function OverviewStep({ onNext, colors, typography, spacing, radius }: any) {
  const theme = { colors, typography, spacing, radius };
  return (
    <>
      {/* hero */}
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.warning,
            marginBottom: spacing.xs,
          }}
        />
        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: 26,
            color: colors.text,
            letterSpacing: -0.5,
          }}
        >
          Before you go
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            lineHeight: 22,
          }}
        >
          Deleting your account is permanent. Read through what this means — it
          only takes a minute.
        </Text>
      </View>

      {/* 30-day badge */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          backgroundColor: colors.warning + "15",
          borderWidth: 1,
          borderColor: colors.warning + "40",
          borderRadius: radius.lg,
          padding: spacing.md,
        }}
      >
        <View style={{ alignItems: "center", minWidth: 44 }}>
          <Text
            style={{
              fontFamily: typography.families.headingBold,
              fontSize: 28,
              color: colors.warning,
              lineHeight: 32,
            }}
          >
            30
          </Text>
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: 10,
              fontWeight: "700",
              color: colors.warning,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            days
          </Text>
        </View>
        <View
          style={{
            width: 1,
            height: 48,
            backgroundColor: colors.warning + "40",
          }}
        />
        <Text
          style={{
            flex: 1,
            fontFamily: typography.families.body,
            fontSize: typography.scale.bodySmall,
            color: colors.warning,
            lineHeight: 19,
          }}
        >
          Your account isn't deleted immediately. You have a full 30-day window
          to change your mind — just sign back in and tap{" "}
          <Text style={{ fontWeight: "700" }}>Cancel deletion</Text>.
        </Text>
      </View>

      {/* deleted items */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
        }}
      >
        <SectionLabel label="What gets deleted" {...theme} />
        {DELETED_ITEMS.map((item) => (
          <ListItem key={item.label} {...item} variant="deleted" {...theme} />
        ))}
      </View>

      {/* kept items */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
        }}
      >
        <SectionLabel label="What stays" {...theme} />
        {KEPT_ITEMS.map((item) => (
          <ListItem key={item.label} {...item} variant="kept" {...theme} />
        ))}
      </View>

      {/* legal */}
      <View
        style={{
          backgroundColor: colors.surfaceSecondary ?? colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.caption,
            fontWeight: "700",
            color: colors.iconMuted,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Data & privacy
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.caption,
            color: colors.textSecondary,
            lineHeight: 19,
          }}
        >
          We process your deletion request under our data retention policy.
          Backups are purged on a rolling 90-day cycle after your account is
          hard-deleted.
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.caption,
            color: colors.textSecondary,
            lineHeight: 19,
          }}
        >
          If you have an active subscription, cancel it first — account deletion
          does not automatically cancel billing.
        </Text>
      </View>

      <Button
        label="I understand — continue"
        onPress={onNext}
        fullWidth
        size="lg"
      />
    </>
  );
}

// ─── step 2: what happens ─────────────────────────────────────────────────────

function WhatHappensStep({
  onNext,
  onBack,
  colors,
  typography,
  spacing,
  radius,
}: any) {
  const STEPS = [
    {
      n: "1",
      title: "You request deletion",
      body: "Your account is immediately locked — you won't be able to create new content or be found in search.",
    },
    {
      n: "2",
      title: "30-day grace period begins",
      body: "Your data is kept privately. No one can see your profile or pins. You can log back in and cancel at any time.",
    },
    {
      n: "3",
      title: "Day 30 — permanent deletion",
      body: "On the 30th day, your account and all associated data are permanently erased. This cannot be reversed.",
    },
    {
      n: "4",
      title: "Backup purge",
      body: "System backups are rotated out within 90 days of hard deletion. After that, no recoverable trace remains.",
    },
  ];

  return (
    <>
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.warning,
            marginBottom: spacing.xs,
          }}
        />
        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: 26,
            color: colors.text,
            letterSpacing: -0.5,
          }}
        >
          What happens next
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            lineHeight: 22,
          }}
        >
          Here's exactly how the 30-day process works.
        </Text>
      </View>

      {STEPS.map(({ n, title, body }) => (
        <View
          key={n}
          style={{
            flexDirection: "row",
            gap: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <Text
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.bodySmall,
                fontWeight: "700",
                color: colors.textSecondary,
              }}
            >
              {n}
            </Text>
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.bodySmall,
                fontWeight: "600",
                color: colors.text,
                letterSpacing: -0.2,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.caption,
                color: colors.textSecondary,
                lineHeight: 19,
              }}
            >
              {body}
            </Text>
          </View>
        </View>
      ))}

      {/* reconsider card */}
      <View
        style={{
          backgroundColor: colors.success + "12",
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.success + "30",
          padding: spacing.md,
          gap: spacing.xs,
        }}
      >
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.bodySmall,
            fontWeight: "700",
            color: colors.success,
          }}
        >
          Not sure?
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.caption,
            color: colors.success,
            lineHeight: 19,
            opacity: 0.85,
          }}
        >
          You can make your account private instead — your profile disappears
          from search and your pins become invisible to everyone except you.
        </Text>
      </View>

      <Button
        label="I still want to delete"
        onPress={onNext}
        fullWidth
        size="lg"
      />
      <Button
        label="Go back"
        onPress={onBack}
        fullWidth
        size="lg"
        variant="outline"
      />
    </>
  );
}

// ─── step 3: confirm ──────────────────────────────────────────────────────────

function ConfirmStep({
  onSubmit,
  onBack,
  loading,
  colors,
  typography,
  spacing,
  radius,
}: any) {
  const [typed, setTyped] = useState("");
  const [touched, setTouched] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const confirmed = typed.toLowerCase().trim() === CONFIRM_PHRASE;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDelete = () => {
    if (!confirmed) {
      shake();
      setTouched(true);
      return;
    }
    onSubmit();
  };

  return (
    <>
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.error,
            marginBottom: spacing.xs,
          }}
        />
        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: 26,
            color: colors.text,
            letterSpacing: -0.5,
          }}
        >
          Final confirmation
        </Text>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            lineHeight: 22,
          }}
        >
          Type{" "}
          <Text
            style={{
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              fontWeight: "700",
              color: colors.error,
            }}
          >
            {CONFIRM_PHRASE}
          </Text>{" "}
          exactly to confirm.
        </Text>
      </View>

      {/* summary */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.sm,
        }}
      >
        {[
          { Icon: Clock, text: "Grace period starts immediately" },
          { Icon: CalendarClock, text: "Account deleted in 30 days" },
          { Icon: CheckCircle, text: "Cancel any time before day 30" },
          { Icon: XCircle, text: "Permanent and irreversible after day 30" },
        ].map(({ Icon, text }) => (
          <View
            key={text}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <Icon size={15} color={colors.textSecondary} />
            <Text
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.bodySmall,
                color: colors.text,
              }}
            >
              {text}
            </Text>
          </View>
        ))}
      </View>

      {/* input */}
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <TextInput
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor:
              touched && !confirmed
                ? colors.error
                : confirmed
                  ? colors.success
                  : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            fontSize: typography.scale.body,
            color: colors.text,
            ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
          }}
          value={typed}
          onChangeText={(t) => {
            setTyped(t);
            setTouched(true);
          }}
          placeholder={CONFIRM_PHRASE}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      </Animated.View>

      {touched && !confirmed && (
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.caption,
            color: colors.error,
            marginTop: -spacing.xs,
            paddingHorizontal: 2,
          }}
        >
          Type exactly:{" "}
          <Text
            style={{
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              fontWeight: "700",
            }}
          >
            {CONFIRM_PHRASE}
          </Text>
        </Text>
      )}

      <TouchableOpacity
        onPress={handleDelete}
        disabled={loading}
        activeOpacity={0.85}
        style={{
          backgroundColor: colors.error,
          borderRadius: radius.md,
          paddingVertical: spacing.md + 2,
          alignItems: "center",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.body,
              fontWeight: "600",
              color: "#fff",
            }}
          >
            Schedule account deletion
          </Text>
        )}
      </TouchableOpacity>

      <Button
        label="Go back"
        onPress={onBack}
        fullWidth
        size="lg"
        variant="outline"
        disabled={loading}
      />
    </>
  );
}

// ─── success screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  scheduledAt,
  onCancel,
  onDone,
  cancelling,
  colors,
  typography,
  spacing,
  radius,
}: any) {
  const date = new Date(scheduledAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 420,
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.warning + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.xs,
          }}
        >
          <CalendarClock size={28} color={colors.warning} />
        </View>

        <Text
          style={{
            fontFamily: typography.families.headingBold,
            fontSize: typography.scale.h2,
            color: colors.text,
            textAlign: "center",
            letterSpacing: -0.4,
          }}
        >
          Deletion scheduled
        </Text>

        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          Your account will be permanently deleted on{" "}
          <Text style={{ fontWeight: "700", color: colors.text }}>{date}</Text>.
        </Text>

        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.bodySmall,
            color: colors.textMuted,
            textAlign: "center",
            lineHeight: 19,
          }}
        >
          Changed your mind? You can cancel any time before that date by signing
          in and tapping the button below.
        </Text>

        <TouchableOpacity
          onPress={onCancel}
          disabled={cancelling}
          activeOpacity={0.85}
          style={{
            width: "100%",
            borderWidth: 1.5,
            borderColor: colors.error + "60",
            backgroundColor: colors.error + "10",
            borderRadius: radius.md,
            paddingVertical: spacing.md + 2,
            alignItems: "center",
            marginTop: spacing.sm,
          }}
        >
          {cancelling ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.body,
                fontWeight: "600",
                color: colors.error,
              }}
            >
              Cancel deletion
            </Text>
          )}
        </TouchableOpacity>

        <Button
          label="Done"
          onPress={onDone}
          fullWidth
          size="lg"
          variant="outline"
          disabled={cancelling}
        />
      </View>
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function DeleteAccountScreen() {
  const { colors, spacing, typography, radius } = useTheme();

  const [step, setStep] = useState<Step>("overview");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const scrollTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const goNext = useCallback((next: Step) => {
    setStep(next);
    scrollTop();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("request_account_deletion");
      if (error) throw error;
      setScheduledAt(data.scheduled_at);
    } catch (err: any) {
      const msg = err.message ?? "Something went wrong. Please try again.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.rpc("cancel_account_deletion");
      if (error) throw error;
      if (data.cancelled) {
        setScheduledAt(null);
        setStep("overview");
        scrollTop();
      }
    } catch (err: any) {
      const msg = err.message ?? "Something went wrong. Please try again.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleDone = () => router.canGoBack() ? router.back() : router.replace('/');

  const themeProps = { colors, typography, spacing, radius };

  if (scheduledAt) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <SuccessScreen
          scheduledAt={scheduledAt}
          onCancel={handleCancelDeletion}
          onDone={handleDone}
          cancelling={cancelling}
          {...themeProps}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={handleDone}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: typography.families.body,
            fontSize: typography.scale.body,
            fontWeight: "600",
            color: colors.text,
          }}
        >
          Delete account
        </Text>
        {/* spacer to centre title */}
        <View style={{ width: 24 }} />
      </View>

      <ProgressBar step={step} colors={colors} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: spacing.xl,
            gap: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* constrain width on web/tablet */}
          <View
            style={{
              width: "100%",

              alignSelf: "center",
              gap: spacing.md,
            }}
          >
            {step === "overview" && (
              <OverviewStep
                onNext={() => goNext("what-happens")}
                {...themeProps}
              />
            )}
            {step === "what-happens" && (
              <WhatHappensStep
                onNext={() => goNext("confirm")}
                onBack={() => goNext("overview")}
                {...themeProps}
              />
            )}
            {step === "confirm" && (
              <ConfirmStep
                onSubmit={handleSubmit}
                onBack={() => goNext("what-happens")}
                loading={loading}
                {...themeProps}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
