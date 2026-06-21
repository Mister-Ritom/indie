import type { BrushType } from './editorTypes';

// ─── Pinterest-accurate 5-row colour palette ─────────────────────────────────
export const COLOR_PALETTE: string[] = [
  // Row 1 – Eyedropper placeholder handled separately; remaining pastels
  '#FFFFFF', '#FFFDE0', '#E8F5E9', '#E0F7FA', '#EDE7F6', '#FFEBEE', '#F8BBD9',
  // Row 2 – Medium / vivid
  '#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#00BCD4', '#9C27B0', '#E91E63',
  // Row 3 – Rich
  '#C62828', '#E65100', '#827717', '#2E7D32', '#1565C0', '#6A1B9A', '#AD1457',
  // Row 4 – Deep
  '#7B1414', '#4E2400', '#33691E', '#004D40', '#1A237E', '#4A148C', '#880E4F',
  // Row 5 – Near-black / neutral
  '#212121', '#424242', '#616161', '#9E9E9E', '#000000',
];

// ─── Brush configurations ────────────────────────────────────────────────────
export interface BrushConfig {
  type: BrushType;
  /** Display label */
  label: string;
  strokeWidth: number;
  opacity: number;
  /** Whether to draw smooth cubic bezier vs straight line segments */
  smooth: boolean;
}

export const BRUSH_CONFIGS: BrushConfig[] = [
  { type: 'marker',      label: 'Marker',      strokeWidth: 14, opacity: 1.0,  smooth: true },
  { type: 'highlighter', label: 'Highlighter',  strokeWidth: 22, opacity: 0.45, smooth: true },
  { type: 'pen',         label: 'Pen',          strokeWidth: 4,  opacity: 1.0,  smooth: true },
  { type: 'ink',         label: 'Ink',          strokeWidth: 8,  opacity: 1.0,  smooth: false },
  { type: 'eraser',      label: 'Eraser',       strokeWidth: 28, opacity: 1.0,  smooth: true },
];

// ─── Default drawing colour ───────────────────────────────────────────────────
export const DEFAULT_DRAW_COLOR = '#FFFFFF';

// ─── Sticker packs (emoji rows) ──────────────────────────────────────────────
export const STICKER_ROWS: string[][] = [
  ['😀', '😂', '🥰', '😎', '🤩', '😜', '🥳'],
  ['❤️', '🔥', '✨', '💫', '⭐', '🎉', '🎊'],
  ['👋', '👍', '👏', '🙌', '✌️', '🤞', '💪'],
  ['🌈', '🦋', '🌸', '🍕', '🎵', '🎸', '🏆'],
  ['🌙', '☀️', '⚡', '🌊', '🍀', '🎯', '💎'],
  ['🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🦋'],
];

// ─── Design tokens ────────────────────────────────────────────────────────────
export const EDITOR_BG = '#111111';
export const TOOLBAR_BG = 'rgba(28,28,28,0.97)';
export const PILL_CANCEL_BG = 'rgba(255,255,255,0.15)';
export const PILL_DONE_BG = '#E60023'; // Pinterest red
export const PILL_GRAY_BG = 'rgba(255,255,255,0.18)';
