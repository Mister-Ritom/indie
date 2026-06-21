import type { PinAsset, PinVariant } from '@/types/database';
import { useBreakpoint } from '@/hooks/useBreakpoint';

/**
 * Selects the best pin_assets variant URL for a given rendering context.
 * Falls back gracefully up the chain if a variant is missing.
 */
export function pickVariant(
  assets: PinAsset[],
  preferred: PinVariant
): string | null {
  if (!assets || assets.length === 0) return null;
  const order: PinVariant[] = ['thumb', '360', '720', '1440', '2160', 'original'];
  const prefIdx = order.indexOf(preferred);
  // Try preferred first, then escalate up
  const candidates = [
    preferred,
    ...order.slice(prefIdx + 1),
    ...order.slice(0, prefIdx).reverse(),
  ];
  for (const v of candidates) {
    const found = assets.find((a) => a.variant === v);
    if (found) return found.url;
  }
  return null;
}

/** Choose the right variant based on column width in pixels */
export function variantForWidth(columnWidth: number): PinVariant {
  if (columnWidth <= 220) return 'thumb';
  if (columnWidth <= 400) return '360';
  if (columnWidth <= 780) return '720';
  if (columnWidth <= 1500) return '1440';
  return '2160';
}

/** Compute column width from window width and column count */
export function columnWidth(
  windowWidth: number,
  cols: number,
  gap = 8,
  padding = 16
): number {
  return Math.floor((windowWidth - padding * 2 - gap * (cols - 1)) / cols);
}
