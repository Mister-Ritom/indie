import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors, radius, typography } = useTheme();

  const containerStyles: ViewStyle = {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: disabled || isLoading ? 0.55 : 1,
    ...(size === 'sm' && { paddingVertical: 8, paddingHorizontal: 16 }),
    ...(size === 'md' && { paddingVertical: 13, paddingHorizontal: 24 }),
    ...(size === 'lg' && { paddingVertical: 16, paddingHorizontal: 32 }),
    ...(variant === 'primary' && { backgroundColor: colors.primary }),
    ...(variant === 'secondary' && { backgroundColor: colors.surface }),
    ...(variant === 'ghost' && { backgroundColor: 'transparent' }),
    ...(variant === 'danger' && { backgroundColor: colors.error }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.border,
    }),
    ...(Platform.OS === 'web' && { cursor: disabled ? 'not-allowed' : 'pointer' }),
  };

  const labelStyles: TextStyle = {
    fontFamily: typography.families.bodyMedium,
    fontSize:
      size === 'sm'
        ? typography.scale.caption
        : size === 'lg'
        ? typography.scale.bodyLarge
        : typography.scale.body,
    ...(variant === 'primary' && { color: '#fff' }),
    ...(variant === 'secondary' && { color: colors.text }),
    ...(variant === 'ghost' && { color: colors.primary }),
    ...(variant === 'danger' && { color: '#fff' }),
    ...(variant === 'outline' && { color: colors.text }),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[containerStyles, style]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={[labelStyles, textStyle]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
