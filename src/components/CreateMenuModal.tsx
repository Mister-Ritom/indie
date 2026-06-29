import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, Pin, LayoutGrid } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface CreateOptionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: any;
  typography: any;
  spacing: any;
  radius: any;
}

function CreateOption({
  icon,
  label,
  onPress,
  colors,
  typography,
  spacing,
  radius,
}: CreateOptionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ alignItems: "center", gap: spacing.sm }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontFamily: typography.families.bodyMedium,
          fontSize: typography.scale.bodySmall,
          color: colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface CreateMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

export function CreateMenuModal({ visible, onClose }: CreateMenuModalProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const isWeb = Platform.OS === "web";

  const [internalVisible, setInternalVisible] = useState(visible);
  const translateY = useSharedValue(isWeb ? 0 : 600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      opacity.value = withTiming(1, { duration: 200 });
      if (!isWeb) translateY.value = withTiming(0, { duration: 250 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      if (!isWeb) translateY.value = withTiming(600, { duration: 220 });
      const timeout = setTimeout(() => {
        setInternalVisible(false);
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [visible, isWeb]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={internalVisible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          alignItems: isWeb ? "center" : "stretch",
        }}
      >
        {/* Dimmed backdrop — tap to dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              {
                position: "absolute",
                backgroundColor: Platform.select({
                  default: "rgba(0, 0, 0, 0.4)",
                  web: "rgba(0, 0, 0, 0.5)",
                }),
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              },
              backdropStyle,
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Responsive Sheet / Modal Card */}
        <AnimatedSafeAreaView
          edges={isWeb ? [] : ["bottom"]}
          style={[
            {
              backgroundColor: colors.surfaceElevated,
              paddingTop: spacing.sm,
              paddingHorizontal: spacing.xl,
              paddingBottom: spacing.lg,
              ...(isWeb
                ? {
                    width: 440,
                    borderRadius: radius.xl,
                    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)",
                    marginBottom: 20,
                  }
                : {
                    borderTopLeftRadius: radius.xl,
                    borderTopRightRadius: radius.xl,
                  }),
            },
            isWeb ? backdropStyle : sheetStyle,
          ]}
        >
          {/* Drag handle — Only render on native layout */}
          {!isWeb && (
            <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>
          )}

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: spacing.xl,
              marginTop: spacing.sm,
              marginHorizontal: spacing.md,
            }}
          >
            <View style={{ width: 22 }} />
            <Text
              style={{
                fontFamily: typography.families.heading,
                fontSize: typography.scale.bodyLarge,
                color: colors.text,
              }}
            >
              Start creating now
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={22} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: spacing.xxl,
              paddingBottom: spacing.lg,
            }}
          >
            <CreateOption
              icon={<Pin size={32} color={colors.icon} />}
              label="Pin"
              onPress={() => {
                onClose();
                setTimeout(() => {
                  router.push("/create/pin");
                }, 50);
              }}
              colors={colors}
              typography={typography}
              spacing={spacing}
              radius={radius}
            />
            <CreateOption
              icon={<LayoutGrid size={32} color={colors.icon} />}
              label="Board"
              onPress={() => {
                onClose();
                setTimeout(() => {
                  router.push("/create/board");
                }, 50);
              }}
              colors={colors}
              typography={typography}
              spacing={spacing}
              radius={radius}
            />
          </View>
        </AnimatedSafeAreaView>
      </View>
    </Modal>
  );
}
