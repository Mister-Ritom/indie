import { useWindowDimensions } from "react-native";
import { theme } from "@/theme/theme";

export type Breakpoint = "sm" | "md" | "lg" | "xl";

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const { breakpoints, grid } = theme;

  const isXl = width >= breakpoints.xl;
  const isLg = width >= breakpoints.lg;
  const isMd = width >= breakpoints.md;
  const isSm = width >= breakpoints.sm;

  const breakpoint: Breakpoint = isXl ? "xl" : isLg ? "lg" : isMd ? "md" : "sm";

  const masonryCols = isXl
    ? grid.cols.xl
    : isLg
      ? grid.cols.lg
      : isMd
        ? grid.cols.md
        : grid.cols.sm;

  const showSidebar = isLg;
  const isWeb = typeof document !== "undefined";

  return {
    width,
    breakpoint,
    isXl,
    isLg,
    isMd,
    isSm,
    masonryCols,
    showSidebar,
    isWeb,
    grid,
  };
}
