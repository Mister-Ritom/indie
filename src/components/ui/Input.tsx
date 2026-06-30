import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  Platform,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerStyle,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    const { colors, spacing, radius, typography } = useTheme();
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = secureTextEntry;

    return (
      <View style={[{ gap: 6 }, containerStyle]}>
        {!!label && (
          <Text
            style={{
              fontFamily: typography.families.bodyMedium,
              fontSize: typography.scale.bodySmall,
              color: colors.text,
            }}
          >
            {label}
          </Text>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBg,
            borderWidth: 1.5,
            borderColor: error
              ? colors.error
              : focused
              ? colors.inputBorderFocused
              : colors.inputBorder,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
          }}
        >
          {leftIcon && (
            <View style={{ marginRight: spacing.sm }}>{leftIcon}</View>
          )}
          <TextInput
            ref={ref}
            {...props}
            secureTextEntry={isPassword && !showPassword}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            style={[
              {
                flex: 1,
                paddingVertical: 14,
                fontFamily: typography.families.body,
                fontSize: typography.scale.body,
                color: colors.text,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
              },
              props.style,
            ]}
            placeholderTextColor={colors.textTertiary}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showPassword ? (
                <EyeOff size={18} color={colors.iconMuted} />
              ) : (
                <Eye size={18} color={colors.iconMuted} />
              )}
            </TouchableOpacity>
          )}
          {!isPassword && rightIcon && (
            <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View>
          )}
        </View>
        {!!error && (
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.caption,
              color: colors.error,
            }}
          >
            {error}
          </Text>
        )}
        {!!hint && !error && (
          <Text
            style={{
              fontFamily: typography.families.body,
              fontSize: typography.scale.caption,
              color: colors.textSecondary,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
