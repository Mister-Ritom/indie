// ─── Core data types for the Photo Editor ────────────────────────────────────

export type BrushType = 'marker' | 'highlighter' | 'pen' | 'ink' | 'eraser';
export type TextAlign = 'left' | 'center' | 'right';
export type TextBgStyle = 'none' | 'solid';
export type EditorTool = 'none' | 'draw' | 'text' | 'sticker' | 'crop';

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawPath {
  id: string;
  points: DrawPoint[];
  color: string;
  strokeWidth: number;
  brushType: BrushType;
  opacity: number;
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  bold: boolean;
  align: TextAlign;
  bgStyle: TextBgStyle;
  scale: number;
  rotation: number;
}

export interface StickerLayer {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
