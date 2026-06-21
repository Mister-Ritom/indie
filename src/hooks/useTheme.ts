import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { theme, type ThemeColors } from '@/theme/theme';
import { useThemeStore } from '@/stores/themeStore';

export function useTheme(): {
  colors: ThemeColors;
  spacing: typeof theme.spacing;
  radius: typeof theme.radius;
  typography: typeof theme.typography;
  shadows: typeof theme.shadows;
  breakpoints: typeof theme.breakpoints;
  grid: typeof theme.grid;
  isDark: boolean;
} {
  const systemScheme = useColorScheme();
  const { mode, resolvedScheme, setResolvedScheme } = useThemeStore();

  useEffect(() => {
    const resolved =
      mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    setResolvedScheme(resolved);
  }, [mode, systemScheme]);

  const colors = theme.colors[resolvedScheme];

  return {
    colors,
    spacing: theme.spacing,
    radius: theme.radius,
    typography: theme.typography,
    shadows: theme.shadows,
    breakpoints: theme.breakpoints,
    grid: theme.grid,
    isDark: resolvedScheme === 'dark',
  };
}
