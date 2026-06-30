import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  xxl: 120,
};

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const { colors, typography } = useTheme();
  const dim = SIZE_MAP[size];
  const fontSize = dim * 0.38;
  const [imgError, setImgError] = useState(false);
  // Reset error when URI changes (e.g. new avatar picked)
  useEffect(() => { setImgError(false); }, [uri]);
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: colors.pillBg,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {uri && !imgError ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : initials ? (
        <Text
          style={{
            fontFamily: typography.families.heading,
            fontSize,
            color: colors.primary,
          }}
        >
          {initials}
        </Text>
      ) : (
        <User size={dim * 0.5} color={colors.iconMuted} />
      )}
    </View>
  );
}
