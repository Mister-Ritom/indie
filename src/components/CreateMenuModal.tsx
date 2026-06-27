import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, Pin, LayoutGrid } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

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

export function CreateMenuModal({ visible, onClose }: CreateMenuModalProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const isWeb = Platform.OS === "web";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "transparent",
          justifyContent: "flex-end",
          alignItems: isWeb ? "center" : "stretch",
        }}
      >
        {/* Dimmed backdrop — tap to dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: Platform.select({
                default: "rgba(0, 0, 0, 0.4)", // Added a slight dim on mobile for better contrast
                web: "rgba(0, 0, 0, 0.5)",
              }),
            }}
          />
        </TouchableWithoutFeedback>

        {/* Responsive Sheet / Modal Card */}
        <SafeAreaView
          edges={isWeb ? [] : ["bottom"]}
          style={{
            backgroundColor: colors.surfaceElevated,
            paddingTop: spacing.sm,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.lg,
            ...(isWeb
              ? {
                  width: 440,
                  borderRadius: radius.xl,
                  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)",
                  marginBottom: spacing.xxl,
                }
              : {
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                }),
          }}
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
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={22} color={colors.icon} />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: typography.families.heading,
                fontSize: typography.scale.bodyLarge,
                color: colors.text,
              }}
            >
              Start creating now
            </Text>
            <View style={{ width: 22 }} />
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
        </SafeAreaView>
      </View>
    </Modal>
  );
}
