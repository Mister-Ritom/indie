/**
 * SkiaEditorCanvas.tsx
 *
 * Cross-platform Skia canvas for the photo editor.
 *   – Native  → GPU / Metal / Vulkan (CanvasKit always ready synchronously)
 *   – Web     → CanvasKit WASM (must be fully loaded before ANY Skia API call)
 *
 * Key web constraints:
 *   • matchFont is NOT implemented on React Native Web → guarded behind Platform.OS !== 'web'
 *   • Text and sticker layers are rendered as RN overlay views on web (not Skia)
 *   • Draw paths still go through Skia Canvas on web (works fine)
 *   • Export on web uses makeImageSnapshot() which only captures draw paths;
 *     text/sticker layers are composited in photo-editor.tsx via html2canvas fallback
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  Canvas,
  Image as SkImage,
  Path,
  useCanvasRef,
  useImage,
  Skia,
  Group,
  Paint,
} from "@shopify/react-native-skia";
import type { DrawPath, TextLayer, StickerLayer } from "./editorTypes";

// matchFont and Text/RoundedRect are only imported on native to avoid the
// "Not implemented on React Native Web" crash.
let SkText: any = null;
let RoundedRect: any = null;
let matchFont: ((descriptor: any) => any) | null = null;

if (Platform.OS !== "web") {
  const skia = require("@shopify/react-native-skia");
  SkText = skia.Text;
  RoundedRect = skia.RoundedRect;
  matchFont = skia.matchFont;
}

const BG_PAD = 8;

// ─── Public API ───────────────────────────────────────────────────────────────
export interface SkiaEditorCanvasHandle {
  exportAsBase64: () => string | null;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  imageUri: string;
  canvasWidth: number;
  canvasHeight: number;
  drawPaths: DrawPath[];
  /** On web, text layers are rendered as RN views in photo-editor.tsx.
   *  Only used here on native for Skia-based export. */
  textLayers: TextLayer[];
  /** Same as above for stickers. */
  stickerLayers: StickerLayer[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildPathString(
  points: { x: number; y: number }[],
  smooth: boolean,
): string {
  if (points.length === 0) return "";
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

const SMOOTH_BRUSHES = new Set<string>([
  "marker",
  "highlighter",
  "pen",
  "eraser",
]);

// ─── Readiness probe ──────────────────────────────────────────────────────────
function canvasKitIsReady(): boolean {
  if (Platform.OS !== "web") return true; // native is always synchronous
  try {
    // @ts-ignore – intentional global probe
    if (typeof CanvasKit === "undefined") return false;
    // @ts-ignore
    if (!CanvasKit.PictureRecorder) return false;
    // @ts-ignore
    if (!CanvasKit.MakeImageFromEncoded) return false;
    // @ts-ignore
    if (!CanvasKit.TypefaceFontProvider) return false;
    return true;
  } catch {
    return false;
  }
}

// ─── Inner canvas ─────────────────────────────────────────────────────────────
interface InnerProps extends Props {
  onReady: (handle: SkiaEditorCanvasHandle) => void;
}

function SkiaEditorCanvasInner({
  imageUri,
  canvasWidth,
  canvasHeight,
  drawPaths,
  textLayers,
  stickerLayers,
  onReady,
}: InnerProps) {
  const canvasRef = useCanvasRef();
  const skiaImage = useImage(imageUri);

  // matchFont is only available on native
  const getFont = useCallback((fontSize: number, bold: boolean) => {
    if (Platform.OS === "web" || !matchFont) return null;
    return matchFont({
      fontFamily: Platform.select({
        ios: "Helvetica Neue",
        android: "Roboto",
        default: "sans-serif",
      }),
      fontSize,
      fontWeight: bold ? "bold" : "normal",
    });
  }, []);

  useEffect(() => {
    onReady({
      exportAsBase64: () => {
        if (!canvasRef.current) return null;
        try {
          const snapshot = canvasRef.current.makeImageSnapshot();
          if (!snapshot) return null;
          return snapshot.encodeToBase64();
        } catch (e) {
          console.error("[SkiaEditorCanvas] exportAsBase64 failed:", e);
          return null;
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isWeb = Platform.OS === "web";

  return (
    <Canvas
      ref={canvasRef}
      style={{ width: canvasWidth, height: canvasHeight }}
    >
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

      <Group layer={<Paint />}>
        {drawPaths.map((dp) => {
          if (dp.points.length === 0) return null;
          const isEraser = dp.brushType === "eraser";
          const smooth = SMOOTH_BRUSHES.has(dp.brushType);
          const pathStr = buildPathString(dp.points, smooth);
          const skPath = Skia.Path.MakeFromSVGString(pathStr);
          if (!skPath) return null;

          return (
            <Path
              key={dp.id}
              path={skPath}
              color={isEraser ? "#000000" : dp.color}
              style="stroke"
              strokeWidth={dp.strokeWidth}
              strokeCap="round"
              strokeJoin="round"
              opacity={isEraser ? 1 : dp.opacity}
              blendMode={isEraser ? "clear" : "srcOver"}
            />
          );
        })}
      </Group>

      {/* Text layers: native only — web uses RN overlay views in photo-editor.tsx */}
      {!isWeb &&
        SkText &&
        RoundedRect &&
        textLayers.map((layer) => {
          const font = getFont(layer.fontSize, layer.bold);
          if (!font) return null;

          const estimatedWidth = layer.text.length * layer.fontSize * 0.6;
          const estimatedHeight = layer.fontSize * 1.4;

          let textX = layer.x;
          if (layer.align === "center") textX = layer.x - estimatedWidth / 2;
          if (layer.align === "right") textX = layer.x - estimatedWidth;

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
              {layer.bgStyle === "solid" && (
                <RoundedRect
                  x={textX - BG_PAD}
                  y={layer.y - estimatedHeight + BG_PAD}
                  width={estimatedWidth + BG_PAD * 2}
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

      {/* Sticker layers: native only */}
      {!isWeb &&
        SkText &&
        stickerLayers.map((sticker) => {
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
                color="white"
              />
            </Group>
          );
        })}
    </Canvas>
  );
}

// ─── Outer shell (exported) ────────────────────────────────────────────────────
export const SkiaEditorCanvas = forwardRef<SkiaEditorCanvasHandle, Props>(
  (props, ref) => {
    const [skiaReady, setSkiaReady] = useState(false);
    const innerHandle = useRef<SkiaEditorCanvasHandle | null>(null);

    useImperativeHandle(ref, () => ({
      exportAsBase64: () => innerHandle.current?.exportAsBase64() ?? null,
    }));

    useEffect(() => {
      if (canvasKitIsReady()) {
        setSkiaReady(true);
        return;
      }

      const id = setInterval(() => {
        if (canvasKitIsReady()) {
          setSkiaReady(true);
          clearInterval(id);
        }
      }, 50);

      return () => clearInterval(id);
    }, []);

    if (!skiaReady) return null;

    return (
      <SkiaEditorCanvasInner
        {...props}
        onReady={(handle) => {
          innerHandle.current = handle;
        }}
      />
    );
  },
);

SkiaEditorCanvas.displayName = "SkiaEditorCanvas";
