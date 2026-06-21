/**
 * SkiaEditorCanvas.tsx
 *
 * The actual Skia canvas that holds ALL editable layers:
 *   – Base photo
 *   – Free-hand drawing paths
 *   – Text overlays (Skia Text)
 *   – Emoji stickers (Skia Text with emoji font)
 *
 * This file is ONLY imported when NOT running inside Expo Go
 * (guarded by PhotoEditorModal).
 *
 * Cross-platform:
 *   – Native  → renders via GPU / Metal / Vulkan
 *   – Web     → renders via CanvasKit WASM (loaded by LoadSkiaWeb in _layout.tsx)
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Platform, Dimensions } from 'react-native';
import {
  Canvas,
  Image as SkImage,
  Path,
  Text as SkText,
  matchFont,
  useCanvasRef,
  useImage,
  Skia,
  Group,
  RoundedRect,
  Paint,
} from '@shopify/react-native-skia';
import type { DrawPath, TextLayer, StickerLayer } from './editorTypes';

const { width: SW } = Dimensions.get('window');

// ─── Public API (accessed via ref from parent) ───────────────────────────────
export interface SkiaEditorCanvasHandle {
  /** Returns a base64-encoded JPEG of the entire edited image, or null on error. */
  exportAsBase64: () => string | null;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  imageUri: string;
  canvasWidth: number;
  canvasHeight: number;
  drawPaths: DrawPath[];
  textLayers: TextLayer[];
  stickerLayers: StickerLayer[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a smooth SVG path string from an array of draw points. */
function buildPathString(points: { x: number; y: number }[], smooth: boolean): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  if (smooth) {
    for (let i = 1; i < points.length - 1; i++) {
      const mid = {
        x: (points[i].x + points[i + 1].x) / 2,
        y: (points[i].y + points[i + 1].y) / 2,
      };
      d += ` Q ${points[i].x} ${points[i].y} ${mid.x} ${mid.y}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
  } else {
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
  }
  return d;
}

const SMOOTH_BRUSHES = new Set<string>(['marker', 'highlighter', 'pen', 'eraser']);

// ─── Component ───────────────────────────────────────────────────────────────
export const SkiaEditorCanvas = forwardRef<SkiaEditorCanvasHandle, Props>(
  ({ imageUri, canvasWidth, canvasHeight, drawPaths, textLayers, stickerLayers }, ref) => {
    const canvasRef = useCanvasRef();
    const skiaImage = useImage(imageUri);

    // ─── Fonts via matchFont (no file loading required) ────────────────────
    const bodyFont24 = useMemo(
      () =>
        matchFont({
          fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'Roboto', default: 'sans-serif' }),
          fontSize: 24,
          fontWeight: 'normal',
        }),
      [],
    );

    const boldFont24 = useMemo(
      () =>
        matchFont({
          fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'Roboto', default: 'sans-serif' }),
          fontSize: 24,
          fontWeight: 'bold',
        }),
      [],
    );

    /** Returns a font matched to the requested size / weight */
    const getFont = useCallback(
      (fontSize: number, bold: boolean) =>
        matchFont({
          fontFamily: Platform.select({
            ios: 'Helvetica Neue',
            android: 'Roboto',
            default: 'sans-serif',
          }),
          fontSize,
          fontWeight: bold ? 'bold' : 'normal',
        }),
      [],
    );

    // ─── Export ────────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      exportAsBase64: () => {
        if (!canvasRef.current) return null;
        try {
          const snapshot = canvasRef.current.makeImageSnapshot();
          if (!snapshot) return null;
          return snapshot.encodeToBase64();
        } catch (e) {
          console.error('[SkiaEditorCanvas] exportAsBase64 failed:', e);
          return null;
        }
      },
    }));

    return (
      <Canvas ref={canvasRef} style={{ width: canvasWidth, height: canvasHeight }}>
        {/* ── Base image ─────────────────────────────────────────────────── */}
        {skiaImage && (
          <SkImage
            image={skiaImage}
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fit="cover"
          />
        )}

        {/* ── Drawing paths ──────────────────────────────────────────────── */}
        <Group layer={<Paint />}>
          {drawPaths.map((dp) => {
            if (dp.points.length === 0) return null;
            const isEraser = dp.brushType === 'eraser';
            const smooth = SMOOTH_BRUSHES.has(dp.brushType);
            const pathStr = buildPathString(dp.points, smooth);
            const skPath = Skia.Path.MakeFromSVGString(pathStr);
            if (!skPath) return null;

            return (
              <Path
                key={dp.id}
                path={skPath}
                color={isEraser ? '#000000' : dp.color}
                style="stroke"
                strokeWidth={dp.strokeWidth}
                strokeCap="round"
                strokeJoin="round"
                opacity={isEraser ? 1 : dp.opacity}
                blendMode={isEraser ? 'clear' : 'srcOver'}
              />
            );
          })}
        </Group>

        {/* ── Text layers ────────────────────────────────────────────────── */}
        {textLayers.map((layer) => {
          const font = getFont(layer.fontSize, layer.bold);
          if (!font) return null;

          const estimatedWidth = layer.text.length * layer.fontSize * 0.6;
          const estimatedHeight = layer.fontSize * 1.4;

          let textX = layer.x;
          if (layer.align === 'center') textX = layer.x - estimatedWidth / 2;
          if (layer.align === 'right') textX = layer.x - estimatedWidth;

          const pivotX = textX + estimatedWidth / 2;
          const pivotY = layer.y - estimatedHeight / 2;

          return (
            <Group 
              key={layer.id}
              transform={[
                { translateX: pivotX },
                { translateY: pivotY },
                { rotate: layer.rotation || 0 },
                { scale: layer.scale || 1 },
                { translateX: -pivotX },
                { translateY: -pivotY },
              ]}
            >
              {/* Solid background badge */}
              {layer.bgStyle === 'solid' && (
                <RoundedRect
                  x={textX - bgPad}
                  y={layer.y - estimatedHeight + bgPad}
                  width={estimatedWidth + bgPad * 2}
                  height={estimatedHeight}
                  r={6}
                  color="rgba(0,0,0,0.55)"
                />
              )}
              <SkText
                x={textX}
                y={layer.y}
                text={layer.text}
                font={font}
                color={layer.color}
              />
            </Group>
          );
        })}

        {/* ── Sticker layers ─────────────────────────────────────────────── */}
        {stickerLayers.map((sticker) => {
          const emojiFont = getFont(52, false);
          if (!emojiFont) return null;
          
          const pivotX = sticker.x + 26;
          const pivotY = sticker.y - 26;

          return (
            <Group
              key={sticker.id}
              transform={[
                { translateX: pivotX },
                { translateY: pivotY },
                { rotate: sticker.rotation || 0 },
                { scale: sticker.scale || 1 },
                { translateX: -pivotX },
                { translateY: -pivotY },
              ]}
            >
              <SkText
                x={sticker.x}
                y={sticker.y}
                text={sticker.emoji}
                font={emojiFont}
                color="white" // Skia ignores this for emoji glyphs
              />
            </Group>
          );
        })}
      </Canvas>
    );
  },
);

SkiaEditorCanvas.displayName = 'SkiaEditorCanvas';
