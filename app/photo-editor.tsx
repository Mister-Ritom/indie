/**
 * photo-editor.tsx
 *
 * Cross-platform photo editor.
 *
 * Layout:
 *   Mobile  → original Pinterest-style stacked layout (toolbar at bottom)
 *   Web/Desktop → sidebar on the left, canvas centred, top action bar
 *
 * Web crash fix:
 *   matchFont / SkText / RoundedRect are NOT implemented on React Native Web.
 *   Those APIs are now guarded inside SkiaEditorCanvas.tsx (Platform.OS !== 'web').
 *   On web, text + sticker layers are rendered as absolutely-positioned RN views
 *   exactly as they were on native, and export uses html-to-image / canvas compositing
 *   instead of Skia's makeImageSnapshot.
 */

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  Text,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import {
  X,
  HelpCircle,
  Crop,
  Image as ImageIcon,
  Type,
  Star,
  Paintbrush,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Pipette,
  Undo2,
  Highlighter,
  PenLine,
  Pen,
  Eraser,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { captureRef } from "react-native-view-shot";

import { useTheme } from "@/hooks/useTheme";
import { useEditorStore } from "@/stores/editorStore";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import {
  COLOR_PALETTE,
  BRUSH_CONFIGS,
  STICKER_ROWS,
  DEFAULT_DRAW_COLOR,
  EDITOR_BG,
  TOOLBAR_BG,
  PILL_DONE_BG,
  PILL_GRAY_BG,
} from "@/components/ui/editor/editorConstants";
import type {
  DrawPath,
  TextLayer,
  StickerLayer,
  EditorTool,
  BrushType,
} from "@/components/ui/editor/editorTypes";
import type { SkiaEditorCanvasHandle } from "@/components/ui/editor/SkiaEditorCanvas";

const isExpoGo =
  Platform.OS !== "web" &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// ─── Breakpoint ───────────────────────────────────────────────────────────────
const WEB_DESKTOP_BREAKPOINT = 768;

// ─── Lazy-load SkiaEditorCanvas ───────────────────────────────────────────────
type SkiaCanvasType =
  typeof import("@/components/ui/editor/SkiaEditorCanvas").SkiaEditorCanvas;

let _idCounter = 0;
const uid = () => `${Date.now()}_${_idCounter++}`;

// ─── Design tokens ────────────────────────────────────────────────────────────
const SIDEBAR_BG = "rgba(18,18,22,0.97)";
const SIDEBAR_WIDTH = 72;
const SIDEBAR_EXPANDED_WIDTH = 220;
const ACCENT = "#6C63FF"; // violet accent for active states on web
const SURFACE = "rgba(255,255,255,0.07)";
const BORDER = "rgba(255,255,255,0.09)";

// ─── Color Sheet ──────────────────────────────────────────────────────────────
function ColorSheet({ visible, selected, onSelect, onClose }: any) {
  if (!visible) return null;
  return (
    <TouchableOpacity
      style={[StyleSheet.absoluteFill, { zIndex: 100 }]}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={cs.sheet} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={cs.grid}>
            <View style={cs.row}>
              <TouchableOpacity
                style={[cs.swatch, cs.eyedropper]}
                onPress={onClose}
              >
                <Pipette size={20} color="#fff" />
              </TouchableOpacity>
              {COLOR_PALETTE.slice(0, 6).map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => onSelect(c)}
                  style={[
                    cs.swatch,
                    { backgroundColor: c },
                    selected === c && cs.swatchSelected,
                  ]}
                />
              ))}
            </View>
            {[7, 14, 21, 28].map((start) => (
              <View key={start} style={cs.row}>
                {COLOR_PALETTE.slice(start, start + 7).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => onSelect(c)}
                    style={[
                      cs.swatch,
                      { backgroundColor: c },
                      selected === c && cs.swatchSelected,
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const cs = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(22,22,28,0.99)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingHorizontal: 12,
  },
  grid: { gap: 8 },
  row: { flexDirection: "row", gap: 8, justifyContent: "center" },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  swatchSelected: { borderWidth: 3, borderColor: "#fff" },
  eyedropper: {
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Web Color Panel (inline, not a sheet) ────────────────────────────────────
function WebColorPanel({ visible, selected, onSelect, onClose }: any) {
  if (!visible) return null;
  return (
    <View style={wcp.panel}>
      <View style={wcp.header}>
        <Text style={wcp.title}>Color</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>
      <View style={wcp.grid}>
        {COLOR_PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => onSelect(c)}
            style={[
              wcp.swatch,
              { backgroundColor: c },
              selected === c && wcp.swatchSelected,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const wcp = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(28,28,36,0.98)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  swatchSelected: { borderWidth: 2.5, borderColor: "#fff" },
});

// ─── Sticker Sheet ────────────────────────────────────────────────────────────
function StickerSheet({ visible, onSelect, onClose }: any) {
  if (!visible) return null;
  return (
    <TouchableOpacity
      style={StyleSheet.absoluteFill}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={ss.sheet} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <Text style={ss.heading}>Stickers</Text>
          <ScrollView>
            {STICKER_ROWS.map((row, ri) => (
              <View key={ri} style={ss.row}>
                {row.map((emoji, ei) => (
                  <TouchableOpacity
                    key={`${ri}-${ei}`}
                    onPress={() => {
                      onSelect(emoji);
                      onClose();
                    }}
                    style={ss.emojiBtn}
                  >
                    <Text style={ss.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const ss = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(22,22,28,0.99)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingHorizontal: 16,
    maxHeight: Dimensions.get("window").height * 0.55,
  },
  heading: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 8,
  },
  emojiBtn: { padding: 6, borderRadius: 10 },
  emoji: { fontSize: 34 },
});

// ─── Web Sticker Panel ────────────────────────────────────────────────────────
function WebStickerPanel({ visible, onSelect, onClose }: any) {
  if (!visible) return null;
  const allEmojis = STICKER_ROWS.flat();
  return (
    <View style={wsp.panel}>
      <View style={wsp.header}>
        <Text style={wsp.title}>STICKERS</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>
      <View style={wsp.grid}>
        {allEmojis.map((emoji, idx) => (
          <TouchableOpacity
            key={`${emoji}-${idx}`}
            onPress={() => {
              onSelect(emoji);
              onClose();
            }}
            style={wsp.emojiBtn}
          >
            <Text style={wsp.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const wsp = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(28,28,36,0.98)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  emojiBtn: { padding: 4 },
  emoji: { fontSize: 26 },
});

// ─── Brush Icon map ───────────────────────────────────────────────────────────
const BRUSH_ICON_COMPONENTS: Record<string, React.FC<any>> = {
  marker: PenLine,
  highlighter: Highlighter,
  pen: Pen,
  ink: Pen,
  eraser: Eraser,
};

// ─── Mobile Draw Toolbar ──────────────────────────────────────────────────────
function DrawToolbar({
  activeBrush,
  brushColor,
  onBrushChange,
  onColorPress,
  onUndo,
}: any) {
  return (
    <View style={dt.container}>
      <TouchableOpacity onPress={onUndo} style={dt.undoBtn}>
        <Undo2 size={20} color="#fff" />
      </TouchableOpacity>
      {BRUSH_CONFIGS.map((cfg) => {
        const IconComp = BRUSH_ICON_COMPONENTS[cfg.type] ?? Pen;
        const isActive = activeBrush === cfg.type;
        return (
          <TouchableOpacity
            key={cfg.type}
            onPress={() => onBrushChange(cfg.type)}
            style={dt.brushBtn}
          >
            <IconComp
              size={24}
              color={isActive ? "#fff" : "rgba(255,255,255,0.45)"}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
            {isActive && <View style={dt.brushUnderline} />}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={onColorPress} style={dt.colorBtn}>
        <View style={[dt.colorCircle, { backgroundColor: brushColor }]} />
      </TouchableOpacity>
    </View>
  );
}

const dt = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: TOOLBAR_BG,
  },
  undoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  brushBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
    minWidth: 36,
  },
  brushUnderline: {
    height: 2,
    width: 24,
    backgroundColor: "#fff",
    borderRadius: 1,
    marginTop: 3,
  },
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
  },
  colorCircle: { flex: 1 },
});

// ─── Text Controls Bar ────────────────────────────────────────────────────────
function TextControlsBar({
  align,
  bgStyle,
  color,
  bold,
  onAlignToggle,
  onBgToggle,
  onBoldToggle,
  onColorPress,
}: any) {
  const AlignIcon =
    align === "left" ? AlignLeft : align === "right" ? AlignRight : AlignCenter;
  const bgIsActive = bgStyle === "solid";
  return (
    <View style={tcb.bar}>
      <TouchableOpacity
        onPress={onBgToggle}
        style={[tcb.btn, bgIsActive && tcb.btnActive]}
      >
        <View
          style={[tcb.bgCircle, bgIsActive && { backgroundColor: "#111" }]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onAlignToggle} style={tcb.btn}>
        <AlignIcon size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onBoldToggle}
        style={[tcb.btn, bold && tcb.btnActive]}
      >
        <Bold size={20} color={bold ? "#111" : "#fff"} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onColorPress} style={tcb.colorBtn}>
        <View style={[tcb.colorDot, { backgroundColor: color }]} />
      </TouchableOpacity>
    </View>
  );
}

const tcb = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(30,30,30,0.92)",
    borderRadius: 32,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnActive: { backgroundColor: "#fff" },
  bgCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: "#fff",
    overflow: "hidden",
  },
  colorDot: { flex: 1 },
});

// ─── Draggable Text ───────────────────────────────────────────────────────────
function DraggableText({
  layer,
  isActive,
  isExporting,
  globalScale,
  globalRotation,
  globalPinchRef,
  globalRotateRef,
  onUpdatePosition,
  onSelect,
  onDelete,
}: any) {
  const { colors } = useTheme();
  const transX = useSharedValue(layer.x);
  const transY = useSharedValue(layer.y);

  useEffect(() => {
    if (isActive) {
      globalScale.value = layer.scale || 1;
      globalRotation.value = layer.rotation || 0;
    }
  }, [isActive]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(5)
        .simultaneousWithExternalGesture(globalPinchRef, globalRotateRef)
        .onStart(() => {
          runOnJS(onSelect)(layer.id, false);
        })
        .onChange((e) => {
          transX.value += e.changeX;
          transY.value += e.changeY;
        })
        .onEnd(() => {
          runOnJS(onUpdatePosition)(layer.id, transX.value, transY.value);
        }),
    [globalPinchRef, globalRotateRef],
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .simultaneousWithExternalGesture(globalPinchRef, globalRotateRef)
        .onEnd(() => {
          runOnJS(onSelect)(layer.id, true);
        }),
    [globalPinchRef, globalRotateRef],
  );

  const composed = useMemo(() => Gesture.Exclusive(pan, tap), [pan, tap]);

  const animatedStyle = useAnimatedStyle(() => {
    const estimatedWidth = layer.text.length * layer.fontSize * 0.6;
    const estimatedHeight = layer.fontSize * 1.4;
    let textX = transX.value;
    if (layer.align === "center") textX = transX.value - estimatedWidth / 2;
    if (layer.align === "right") textX = transX.value - estimatedWidth;
    const currentScale = isActive ? globalScale.value : layer.scale || 1;
    const currentRotation = isActive
      ? globalRotation.value
      : layer.rotation || 0;
    return {
      position: "absolute",
      left: textX - 16,
      top: transY.value - estimatedHeight - 16,
      transform: [
        { scale: currentScale },
        { rotateZ: `${currentRotation}rad` },
      ],
      opacity: isExporting && Platform.OS === "web" ? 0 : 1,
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={animatedStyle}>
        <View
          style={{
            padding: 16,
            borderWidth: isActive ? 1.5 : 0,
            borderColor: "rgba(255,255,255,0.8)",
            borderStyle: "dashed",
            borderRadius: 8,
          }}
        >
          <Text
            style={[
              styles.textOverlayText,
              {
                color: layer.color,
                fontSize: layer.fontSize,
                fontWeight: layer.bold ? "700" : "400",
                textAlign: layer.align,
                backgroundColor:
                  layer.bgStyle === "solid" ? "rgba(0,0,0,0.5)" : "transparent",
              },
            ]}
          >
            {layer.text}
          </Text>
        </View>
        {isActive && (
          <TouchableOpacity
            onPress={() => onDelete(layer.id)}
            style={styles.layerDeleteBtn}
          >
            <Trash2 size={16} color={colors.error} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Draggable Sticker ────────────────────────────────────────────────────────
function DraggableSticker({
  layer,
  isActive,
  isExporting,
  globalScale,
  globalRotation,
  globalPinchRef,
  globalRotateRef,
  onUpdateLayer,
  onSelect,
  onDelete,
}: any) {
  const { colors } = useTheme();
  const transX = useSharedValue(layer.x);
  const transY = useSharedValue(layer.y);

  useEffect(() => {
    if (isActive) {
      globalScale.value = layer.scale || 1;
      globalRotation.value = layer.rotation || 0;
    }
  }, [isActive]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(5)
        .simultaneousWithExternalGesture(globalPinchRef, globalRotateRef)
        .onStart(() => {
          runOnJS(onSelect)(layer.id, false);
        })
        .onChange((e) => {
          transX.value += e.changeX;
          transY.value += e.changeY;
        })
        .onEnd(() => {
          runOnJS(onUpdateLayer)(layer.id, transX.value, transY.value);
        }),
    [globalPinchRef, globalRotateRef],
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .simultaneousWithExternalGesture(globalPinchRef, globalRotateRef)
        .onEnd(() => {
          runOnJS(onSelect)(layer.id, true);
        }),
    [globalPinchRef, globalRotateRef],
  );

  const composed = useMemo(() => Gesture.Exclusive(pan, tap), [pan, tap]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentScale = isActive ? globalScale.value : layer.scale || 1;
    const currentRotation = isActive
      ? globalRotation.value
      : layer.rotation || 0;
    return {
      position: "absolute",
      left: transX.value - 16,
      top: transY.value - 40 - 16,
      transform: [
        { scale: currentScale },
        { rotateZ: `${currentRotation}rad` },
      ],
      opacity: isExporting && Platform.OS === "web" ? 0 : 1,
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={animatedStyle}>
        <View
          style={{
            padding: 16,
            borderWidth: isActive ? 1.5 : 0,
            borderColor: "rgba(255,255,255,0.8)",
            borderStyle: "dashed",
            borderRadius: 8,
          }}
        >
          <Text style={styles.stickerEmoji}>{layer.emoji}</Text>
        </View>
        {isActive && (
          <TouchableOpacity
            onPress={() => onDelete(layer.id)}
            style={styles.layerDeleteBtn}
          >
            <Trash2 size={16} color={colors.error} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Web Sidebar Tool Button ──────────────────────────────────────────────────
function SidebarToolBtn({ icon: Icon, label, isActive, onPress, color }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[wb.toolBtn, isActive && wb.toolBtnActive]}
    >
      <Icon
        size={20}
        color={isActive ? "#fff" : "rgba(255,255,255,0.55)"}
        strokeWidth={isActive ? 2.2 : 1.7}
      />
      <Text style={[wb.toolLabel, isActive && wb.toolLabelActive]}>
        {label}
      </Text>
      {isActive && (
        <View style={[wb.activePip, { backgroundColor: color || ACCENT }]} />
      )}
    </TouchableOpacity>
  );
}

const wb = StyleSheet.create({
  toolBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 5,
    position: "relative",
  },
  toolBtnActive: { backgroundColor: "rgba(108,99,255,0.18)" },
  toolLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "500",
  },
  toolLabelActive: { color: "rgba(255,255,255,0.85)" },
  activePip: {
    position: "absolute",
    left: 4,
    top: "50%",
    width: 3,
    height: 20,
    borderRadius: 2,
    marginTop: -10,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PhotoEditorScreen() {
  const {
    originalUri: imageUri,
    imageWidth,
    imageHeight,
    setEditedImage,
  } = useEditorStore();

  const { width: windowWidth } = useWindowDimensions();
  const isDesktop =
    Platform.OS === "web" && windowWidth >= WEB_DESKTOP_BREAKPOINT;

  const [activeTool, setActiveTool] = useState<EditorTool>("none");

  // Animated sidebar width
  const sidebarAnimWidth = useSharedValue(SIDEBAR_WIDTH);
  const animatedSidebarStyle = useAnimatedStyle(() => ({
    width: sidebarAnimWidth.value,
  }));
  const [showCrop, setShowCrop] = useState(false);
  const [showColorSheet, setShowColorSheet] = useState(false);
  const [showStickerSheet, setShowStickerSheet] = useState(false);
  // Web-only: which sidebar sub-panel is open
  const [webColorTarget, setWebColorTarget] = useState<
    "draw" | "text" | "layer" | null
  >(null);

  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [initialDrawPaths, setInitialDrawPaths] = useState<DrawPath[]>([]);
  const [activeBrush, setActiveBrush] = useState<BrushType>("marker");
  const [brushColor, setBrushColor] = useState(DEFAULT_DRAW_COLOR);
  const currentPathRef = useRef<DrawPath | null>(null);

  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [editingText, setEditingText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textBold, setTextBold] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(
    "center",
  );
  const [textBgStyle, setTextBgStyle] = useState<"none" | "solid">("none");

  const [stickerLayers, setStickerLayers] = useState<StickerLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [currentUri, setCurrentUri] = useState(imageUri || "");
  const [isExporting, setIsExporting] = useState(false);

  // Expand/collapse sidebar with animation
  useEffect(() => {
    const expanded = activeTool !== "none" || showStickerSheet;
    sidebarAnimWidth.value = withTiming(
      expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_WIDTH,
      { duration: 220 },
    );
  }, [activeTool, showStickerSheet]);

  const [SkiaEditorCanvasComponent, setSkiaEditorCanvasComponent] =
    useState<SkiaCanvasType | null>(null);

  useEffect(() => {
    if (isExpoGo) return;
    const mod = require("@/components/ui/editor/SkiaEditorCanvas");
    setSkiaEditorCanvasComponent(() => mod.SkiaEditorCanvas as SkiaCanvasType);
  }, []);

  // ── Canvas sizing ──────────────────────────────────────────────────────────
  const { canvasWidth, canvasHeight } = useMemo(() => {
    const SW = windowWidth;
    const SH = Dimensions.get("window").height;

    if (isDesktop) {
      // On web desktop: subtract sidebar width, leave room for top bar
      const sidebarW =
        activeTool !== "none" || showStickerSheet
          ? SIDEBAR_EXPANDED_WIDTH
          : SIDEBAR_WIDTH;
      const availW = SW - sidebarW - 48;
      const availH = SH - 80;
      if (!imageWidth || !imageHeight)
        return {
          canvasWidth: Math.min(availW, 800),
          canvasHeight: Math.min(availH, 600),
        };
      const aspect = imageWidth / imageHeight;
      let w = availW;
      let h = w / aspect;
      if (h > availH) {
        h = availH;
        w = h * aspect;
      }
      return { canvasWidth: Math.round(w), canvasHeight: Math.round(h) };
    }

    const maxWidth = SW;
    const maxHeight = SH * 0.75;
    if (!imageWidth || !imageHeight)
      return { canvasWidth: SW, canvasHeight: Math.round(SW * (4 / 3)) };
    const aspect = imageWidth / imageHeight;
    let w = maxWidth;
    let h = w / aspect;
    if (h > maxHeight) {
      h = maxHeight;
      w = h * aspect;
    }
    return { canvasWidth: w, canvasHeight: h };
  }, [
    imageWidth,
    imageHeight,
    windowWidth,
    isDesktop,
    activeTool,
    showStickerSheet,
  ]);

  const globalScale = useSharedValue(1);
  const savedGlobalScale = useSharedValue(1);
  const globalRotation = useSharedValue(0);
  const savedGlobalRotation = useSharedValue(0);

  const saveActiveTransform = useCallback(() => {
    if (!activeLayerId) return;
    setTextLayers((prev) =>
      prev.map((l) =>
        l.id === activeLayerId
          ? { ...l, scale: globalScale.value, rotation: globalRotation.value }
          : l,
      ),
    );
    setStickerLayers((prev) =>
      prev.map((l) =>
        l.id === activeLayerId
          ? { ...l, scale: globalScale.value, rotation: globalRotation.value }
          : l,
      ),
    );
  }, [activeLayerId]);

  const globalPinchRef = useRef(
    Gesture.Pinch()
      .onStart(() => {
        savedGlobalScale.value = globalScale.value;
      })
      .onUpdate((e) => {
        globalScale.value = savedGlobalScale.value * e.scale;
      })
      .onEnd(() => {
        runOnJS(saveActiveTransform)();
      }),
  ).current;

  const globalRotateRef = useRef(
    Gesture.Rotation()
      .onStart(() => {
        savedGlobalRotation.value = globalRotation.value;
      })
      .onUpdate((e) => {
        globalRotation.value = savedGlobalRotation.value + e.rotation;
      })
      .onEnd(() => {
        runOnJS(saveActiveTransform)();
      }),
  ).current;

  const globalTransformGesture = useMemo(
    () => Gesture.Simultaneous(globalPinchRef, globalRotateRef),
    [globalPinchRef, globalRotateRef],
  );

  useEffect(() => {
    if (imageUri && !currentUri) setCurrentUri(imageUri);
  }, [imageUri, currentUri]);

  const captureViewRef = useRef<View>(null);
  const canvasRef = useRef<SkiaEditorCanvasHandle>(null);

  const brushConfig = useMemo(
    () => BRUSH_CONFIGS.find((b) => b.type === activeBrush)!,
    [activeBrush],
  );

  const drawGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .runOnJS(true)
        .onStart((e) => {
          if (activeTool !== "draw") return;
          const newPath: DrawPath = {
            id: uid(),
            points: [{ x: e.x, y: e.y }],
            color: brushColor,
            strokeWidth: brushConfig.strokeWidth,
            brushType: activeBrush,
            opacity: brushConfig.opacity,
          };
          currentPathRef.current = newPath;
          setDrawPaths((prev) => [...prev, newPath]);
        })
        .onUpdate((e) => {
          if (activeTool !== "draw" || !currentPathRef.current) return;
          const updatedPath = {
            ...currentPathRef.current,
            points: [...currentPathRef.current.points, { x: e.x, y: e.y }],
          };
          currentPathRef.current = updatedPath;
          setDrawPaths((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = updatedPath;
            return copy;
          });
        })
        .onEnd(() => {
          currentPathRef.current = null;
        }),
    [activeTool, brushColor, brushConfig, activeBrush],
  );

  const canvasBackgroundTap = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        runOnJS(setActiveLayerId)(null);
      }),
    [],
  );

  const canvasGestures = useMemo(() => {
    if (activeTool === "draw") return drawGesture;
    return canvasBackgroundTap;
  }, [activeTool, drawGesture, canvasBackgroundTap]);

  const addTextLayer = useCallback(() => {
    if (!editingText.trim()) {
      setActiveTool("none");
      setEditingLayerId(null);
      return;
    }
    if (editingLayerId) {
      setTextLayers((prev) =>
        prev.map((l) =>
          l.id === editingLayerId
            ? {
                ...l,
                text: editingText.trim(),
                color: textColor,
                bold: textBold,
                align: textAlign,
                bgStyle: textBgStyle,
              }
            : l,
        ),
      );
      setActiveLayerId(editingLayerId);
      setEditingLayerId(null);
    } else {
      const newLayer: TextLayer = {
        id: uid(),
        text: editingText.trim(),
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        color: textColor,
        fontSize: 32,
        bold: textBold,
        align: textAlign,
        bgStyle: textBgStyle,
        scale: 1,
        rotation: 0,
      };
      setTextLayers((prev) => [...prev, newLayer]);
      setActiveLayerId(newLayer.id);
    }
    setEditingText("");
    setActiveTool("none");
  }, [
    editingText,
    editingLayerId,
    textColor,
    textBold,
    textAlign,
    textBgStyle,
    canvasWidth,
    canvasHeight,
  ]);

  const handleToolCancel = useCallback(() => {
    if (activeTool === "draw") setDrawPaths(initialDrawPaths);
    else if (activeTool === "text") {
      setEditingText("");
      setEditingLayerId(null);
    }
    setActiveTool("none");
  }, [activeTool, initialDrawPaths]);

  const handleToolDone = useCallback(() => {
    if (activeTool === "text") addTextLayer();
    else setActiveTool("none");
  }, [activeTool, addTextLayer]);

  const updateTextPosition = useCallback((id: string, x: number, y: number) => {
    setTextLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, x, y } : l)),
    );
  }, []);

  const addSticker = useCallback(
    (emoji: string) => {
      const newSticker: StickerLayer = {
        id: uid(),
        emoji,
        x: canvasWidth / 2 - 30,
        y: canvasHeight / 2 - 30,
        scale: 1,
        rotation: 0,
      };
      setStickerLayers((prev) => [...prev, newSticker]);
      setActiveLayerId(newSticker.id);
    },
    [canvasWidth, canvasHeight],
  );

  const updateStickerLayer = useCallback((id: string, x: number, y: number) => {
    setStickerLayers((prev) =>
      prev.map((sl) => (sl.id === id ? { ...sl, x, y } : sl)),
    );
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setTextLayers((prev) => prev.filter((l) => l.id !== id));
    setStickerLayers((prev) => prev.filter((l) => l.id !== id));
    setActiveLayerId((prev) => (prev === id ? null : prev));
  }, []);

  const activeTextLayer = textLayers.find((l) => l.id === activeLayerId);

  const handleLayerSelect = useCallback(
    (id: string, isTap = false) => {
      if (activeLayerId === id && isTap) {
        const layer = textLayers.find((l) => l.id === id);
        if (layer) {
          setEditingText(layer.text);
          setTextColor(layer.color);
          setTextBold(layer.bold);
          setTextAlign(layer.align);
          setTextBgStyle(layer.bgStyle);
          setEditingLayerId(id);
          setActiveTool("text");
        }
      } else {
        setActiveLayerId(id);
      }
    },
    [activeLayerId, textLayers],
  );

  const updateActiveTextLayer = (updates: Partial<TextLayer>) => {
    if (!activeLayerId) return;
    setTextLayers((prev) =>
      prev.map((l) => (l.id === activeLayerId ? { ...l, ...updates } : l)),
    );
  };

  const undoLastPath = useCallback(() => {
    setDrawPaths((prev) => prev.slice(0, -1));
  }, []);

  const handleDone = useCallback(async () => {
    setActiveLayerId(null);
    setActiveTool("none");
    setIsExporting(true);

    if (Platform.OS === "web") {
      // Web export strategy:
      // 1. Get the Skia snapshot (base image + draw paths) as base64
      // 2. Create an HTML5 canvas sized to the canvas dimensions
      // 3. Draw the Skia snapshot onto it
      // 4. Draw each text/sticker layer on top using canvas 2D API
      // 5. Export as data URL
      setTimeout(async () => {
        try {
          const skiaBase64 = canvasRef.current?.exportAsBase64() ?? null;

          // The offscreen canvas is sized to the Skia snapshot's actual pixel
          // dimensions (which are at device pixel ratio). We then scale all
          // layer coordinates (which are in logical CSS px) by the same ratio
          // so text/stickers land in the right spot on the full-res export.
          const dpr = window.devicePixelRatio || 1;
          const exportW = Math.round(canvasWidth * dpr);
          const exportH = Math.round(canvasHeight * dpr);

          const offscreen = document.createElement("canvas");
          offscreen.width = exportW;
          offscreen.height = exportH;
          const ctx = offscreen.getContext("2d")!;

          // Scale all subsequent drawing by DPR so logical-px coords map correctly
          ctx.scale(dpr, dpr);

          // Draw the Skia layer (image + draw paths) scaled to logical canvas size
          if (skiaBase64) {
            await new Promise<void>((resolve, reject) => {
              const img = new window.Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                resolve();
              };
              img.onerror = reject;
              img.src = `data:image/jpeg;base64,${skiaBase64}`;
            });
          } else {
            // Fallback: draw the source image directly
            await new Promise<void>((resolve, reject) => {
              const img = new window.Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                resolve();
              };
              img.onerror = reject;
              img.src = currentUri;
            });
          }

          // Draw text layers
          // The DraggableText animated style places the view at:
          //   left: textX - 16,  top: transY - estimatedHeight - 16
          // with 16px padding inside, so the text baseline visually sits at (layer.x, layer.y).
          // We replicate that: translate to (layer.x, layer.y) and draw with alphabetic baseline.
          for (const layer of textLayers) {
            const scale = layer.scale || 1;
            const fontSize = layer.fontSize;
            const estimatedWidth = layer.text.length * fontSize * 0.6;

            // pivot = same pivot used by the Skia Group transform
            let textX = layer.x;
            if (layer.align === "center") textX = layer.x - estimatedWidth / 2;
            if (layer.align === "right") textX = layer.x - estimatedWidth;
            const pivotX = textX + estimatedWidth / 2;
            const pivotY = layer.y - (fontSize * 1.4) / 2;

            ctx.save();
            // Apply scale+rotation around the same pivot point
            ctx.translate(pivotX, pivotY);
            ctx.rotate(layer.rotation || 0);
            ctx.scale(scale, scale);
            ctx.translate(-pivotX, -pivotY);

            ctx.font = `${layer.bold ? "bold" : "normal"} ${fontSize}px sans-serif`;
            ctx.textAlign = layer.align as CanvasTextAlign;
            ctx.textBaseline = "alphabetic";

            if (layer.bgStyle === "solid") {
              const metrics = ctx.measureText(layer.text);
              const textH = fontSize * 1.4;
              let bgX = textX;
              ctx.fillStyle = "rgba(0,0,0,0.5)";
              ctx.fillRect(
                bgX - 4,
                layer.y - textH,
                metrics.width + 8,
                textH + 4,
              );
            }

            ctx.fillStyle = layer.color;
            ctx.fillText(layer.text, layer.x, layer.y);
            ctx.restore();
          }

          // Draw sticker layers
          // DraggableSticker animated style: left: x-16, top: y-40-16
          // with 16px padding inside → emoji top-left corner visually at (x, y-40).
          // Emoji font size is 52. We draw with textBaseline "top" at (x, y-40).
          for (const sticker of stickerLayers) {
            const scale = sticker.scale || 1;
            const size = 52;
            const drawX = sticker.x;
            const drawY = sticker.y - 40; // matches the -40-16+16 padding cancellation
            const pivotX = drawX + 26; // ~half emoji width
            const pivotY = drawY + 26; // ~half emoji height

            ctx.save();
            ctx.translate(pivotX, pivotY);
            ctx.rotate(sticker.rotation || 0);
            ctx.scale(scale, scale);
            ctx.translate(-pivotX, -pivotY);

            ctx.font = `${size}px sans-serif`;
            ctx.textBaseline = "top";
            ctx.fillText(sticker.emoji, drawX, drawY);
            ctx.restore();
          }

          const dataUrl = offscreen.toDataURL("image/jpeg", 0.95);
          setEditedImage(dataUrl);
          router.back();
        } catch (err) {
          console.error("Web export failed:", err);
          setEditedImage(currentUri);
          router.back();
        }
      }, 50);
      return;
    }

    if (!captureViewRef.current) {
      setEditedImage(currentUri);
      router.back();
      return;
    }

    setTimeout(async () => {
      try {
        const uri = await captureRef(captureViewRef, {
          format: "jpg",
          quality: 1,
        });
        setEditedImage(uri);
        setIsExporting(false);
        router.back();
      } catch (err) {
        console.error("Export failed:", err);
        setEditedImage(currentUri);
        setIsExporting(false);
        router.back();
      }
    }, 50);
  }, [
    currentUri,
    canvasWidth,
    canvasHeight,
    textLayers,
    stickerLayers,
    setEditedImage,
  ]);

  const handleToolPress = (tool: EditorTool) => {
    setActiveLayerId(null);
    setWebColorTarget(null);
    if (tool === "crop") {
      setShowCrop(true);
      return;
    }
    if (tool === "sticker") {
      if (isDesktop) {
        setShowStickerSheet((v) => !v);
      } else {
        setShowStickerSheet(true);
      }
      return;
    }
    if (tool === "draw") setInitialDrawPaths([...drawPaths]);
    setActiveTool((prev) => (prev === tool ? "none" : tool));
  };

  const handleCancel = () => {
    router.back();
  };

  // ── Keyboard shortcut (web) ────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleToolCancel();
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) undoLastPath();
      if (e.key === "Enter" && activeTool === "text") addTextLayer();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTool, handleToolCancel, undoLastPath, addTextLayer]);

  // ─── Expo Go fallback ──────────────────────────────────────────────────────
  const renderExpoGoFallback = () => (
    <View style={styles.expoGoFallback}>
      <Text style={styles.expoGoTitle}>Photo Editor</Text>
      <Text style={styles.expoGoSubtitle}>
        The photo editor requires a development build and is not available in
        Expo Go.
      </Text>
      <TouchableOpacity style={styles.expoGoBtn} onPress={handleCancel}>
        <Text style={styles.expoGoBtnLabel}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Canvas area (shared between web and mobile) ───────────────────────────
  const renderCanvas = () => (
    <GestureDetector gesture={canvasGestures}>
      <View
        style={[
          styles.canvasInner,
          { width: canvasWidth, height: canvasHeight },
          isDesktop && styles.canvasInnerDesktop,
        ]}
        ref={captureViewRef}
        collapsable={false}
      >
        {SkiaEditorCanvasComponent && currentUri ? (
          <SkiaEditorCanvasComponent
            ref={canvasRef}
            imageUri={currentUri}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            drawPaths={drawPaths}
            textLayers={isExporting && Platform.OS === "web" ? textLayers : []}
            stickerLayers={
              isExporting && Platform.OS === "web" ? stickerLayers : []
            }
          />
        ) : null}

        {textLayers.map((layer) => (
          <DraggableText
            key={layer.id}
            layer={layer}
            isActive={activeLayerId === layer.id}
            isExporting={isExporting}
            globalScale={globalScale}
            globalRotation={globalRotation}
            globalPinchRef={globalPinchRef}
            globalRotateRef={globalRotateRef}
            onUpdatePosition={updateTextPosition}
            onSelect={handleLayerSelect}
            onDelete={deleteLayer}
          />
        ))}

        {stickerLayers.map((sticker) => (
          <DraggableSticker
            key={sticker.id}
            layer={sticker}
            isActive={activeLayerId === sticker.id}
            isExporting={isExporting}
            globalScale={globalScale}
            globalRotation={globalRotation}
            globalPinchRef={globalPinchRef}
            globalRotateRef={globalRotateRef}
            onUpdateLayer={updateStickerLayer}
            onSelect={handleLayerSelect}
            onDelete={deleteLayer}
          />
        ))}
      </View>
    </GestureDetector>
  );

  // ─── WEB DESKTOP LAYOUT ────────────────────────────────────────────────────
  if (!isExpoGo && isDesktop) {
    const activeColor =
      activeTool === "draw"
        ? brushColor
        : (activeTextLayer?.color ?? textColor);

    return (
      <>
        <StatusBar hidden />
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0e0e12" }}>
          <GestureDetector gesture={globalTransformGesture}>
            <View style={dsk.root}>
              {/* ── Left Sidebar ──────────────────────────────────── */}
              <Animated.View style={[dsk.sidebar, animatedSidebarStyle]}>
                {/* Logo / close */}
                <View style={dsk.sidebarTop}>
                  <TouchableOpacity onPress={handleCancel} style={dsk.closeBtn}>
                    <X
                      size={16}
                      color="rgba(255,255,255,0.6)"
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                </View>

                <View style={dsk.divider} />

                {/* Tool buttons */}
                <ScrollView
                  style={{ flex: 1 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={dsk.toolList}
                >
                  <SidebarToolBtn
                    icon={Crop}
                    label="Crop"
                    isActive={showCrop}
                    onPress={() => handleToolPress("crop")}
                  />
                  <SidebarToolBtn
                    icon={Type}
                    label="Text"
                    isActive={activeTool === "text"}
                    onPress={() => handleToolPress("text")}
                  />
                  <SidebarToolBtn
                    icon={Star}
                    label="Stickers"
                    isActive={showStickerSheet}
                    onPress={() => handleToolPress("sticker")}
                  />
                  <SidebarToolBtn
                    icon={Paintbrush}
                    label="Draw"
                    isActive={activeTool === "draw"}
                    onPress={() => handleToolPress("draw")}
                  />

                  {/* Draw sub-panel */}
                  {activeTool === "draw" && (
                    <View style={dsk.subPanel}>
                      <View style={dsk.subPanelHeader}>
                        <Text style={dsk.subPanelTitle}>BRUSH</Text>
                      </View>
                      {BRUSH_CONFIGS.map((cfg) => {
                        const IconComp = BRUSH_ICON_COMPONENTS[cfg.type] ?? Pen;
                        const isAct = activeBrush === cfg.type;
                        return (
                          <TouchableOpacity
                            key={cfg.type}
                            onPress={() =>
                              setActiveBrush(cfg.type as BrushType)
                            }
                            style={[dsk.brushRow, isAct && dsk.brushRowActive]}
                          >
                            <IconComp
                              size={16}
                              color={isAct ? "#fff" : "rgba(255,255,255,0.5)"}
                            />
                            <Text
                              style={[
                                dsk.brushRowLabel,
                                isAct && { color: "#fff" },
                              ]}
                            >
                              {cfg.type.charAt(0).toUpperCase() +
                                cfg.type.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        onPress={() => setWebColorTarget("draw")}
                        style={dsk.colorPickerRow}
                      >
                        <View
                          style={[
                            dsk.colorDot,
                            { backgroundColor: brushColor },
                          ]}
                        />
                        <Text style={dsk.colorPickerLabel}>Color</Text>
                      </TouchableOpacity>
                      {webColorTarget === "draw" && (
                        <WebColorPanel
                          visible
                          selected={brushColor}
                          onSelect={(c: string) => {
                            setBrushColor(c);
                            setWebColorTarget(null);
                          }}
                          onClose={() => setWebColorTarget(null)}
                        />
                      )}
                      <TouchableOpacity
                        onPress={undoLastPath}
                        style={dsk.undoRow}
                      >
                        <Undo2 size={14} color="rgba(255,255,255,0.6)" />
                        <Text style={dsk.undoLabel}>Undo stroke</Text>
                        <Text style={dsk.shortcut}>⌘Z</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Text sub-panel */}
                  {activeTool === "text" && (
                    <View style={dsk.subPanel}>
                      <View style={dsk.subPanelHeader}>
                        <Text style={dsk.subPanelTitle}>TEXT</Text>
                      </View>
                      {/* Align */}
                      <View style={dsk.rowBtns}>
                        {(["left", "center", "right"] as const).map((a) => {
                          const Ic =
                            a === "left"
                              ? AlignLeft
                              : a === "right"
                                ? AlignRight
                                : AlignCenter;
                          return (
                            <TouchableOpacity
                              key={a}
                              onPress={() => setTextAlign(a)}
                              style={[
                                dsk.miniBtn,
                                textAlign === a && dsk.miniBtnActive,
                              ]}
                            >
                              <Ic
                                size={14}
                                color={
                                  textAlign === a
                                    ? "#fff"
                                    : "rgba(255,255,255,0.5)"
                                }
                              />
                            </TouchableOpacity>
                          );
                        })}
                        <TouchableOpacity
                          onPress={() => setTextBold((b) => !b)}
                          style={[dsk.miniBtn, textBold && dsk.miniBtnActive]}
                        >
                          <Bold
                            size={14}
                            color={textBold ? "#fff" : "rgba(255,255,255,0.5)"}
                          />
                        </TouchableOpacity>
                      </View>
                      {/* BG style */}
                      <TouchableOpacity
                        onPress={() =>
                          setTextBgStyle((s) =>
                            s === "none" ? "solid" : "none",
                          )
                        }
                        style={[
                          dsk.toggleRow,
                          textBgStyle === "solid" && dsk.toggleRowActive,
                        ]}
                      >
                        <Text style={dsk.toggleLabel}>Background</Text>
                        <View
                          style={[
                            dsk.togglePill,
                            textBgStyle === "solid" && dsk.togglePillOn,
                          ]}
                        />
                      </TouchableOpacity>
                      {/* Color */}
                      <TouchableOpacity
                        onPress={() => setWebColorTarget("text")}
                        style={dsk.colorPickerRow}
                      >
                        <View
                          style={[dsk.colorDot, { backgroundColor: textColor }]}
                        />
                        <Text style={dsk.colorPickerLabel}>Color</Text>
                      </TouchableOpacity>
                      {webColorTarget === "text" && (
                        <WebColorPanel
                          visible
                          selected={textColor}
                          onSelect={(c: string) => {
                            setTextColor(c);
                            setWebColorTarget(null);
                          }}
                          onClose={() => setWebColorTarget(null)}
                        />
                      )}
                    </View>
                  )}

                  {/* Sticker sub-panel */}
                  {showStickerSheet && (
                    <WebStickerPanel
                      visible
                      onSelect={addSticker}
                      onClose={() => setShowStickerSheet(false)}
                    />
                  )}

                  {/* Active text layer controls */}
                  {activeTool !== "text" && activeTextLayer && (
                    <View style={dsk.subPanel}>
                      <View style={dsk.subPanelHeader}>
                        <Text style={dsk.subPanelTitle}>LAYER</Text>
                        <TouchableOpacity
                          onPress={() => deleteLayer(activeTextLayer.id)}
                        >
                          <Trash2 size={12} color="rgba(255,80,80,0.8)" />
                        </TouchableOpacity>
                      </View>
                      <View style={dsk.rowBtns}>
                        {(["left", "center", "right"] as const).map((a) => {
                          const Ic =
                            a === "left"
                              ? AlignLeft
                              : a === "right"
                                ? AlignRight
                                : AlignCenter;
                          return (
                            <TouchableOpacity
                              key={a}
                              onPress={() =>
                                updateActiveTextLayer({ align: a })
                              }
                              style={[
                                dsk.miniBtn,
                                activeTextLayer.align === a &&
                                  dsk.miniBtnActive,
                              ]}
                            >
                              <Ic
                                size={14}
                                color={
                                  activeTextLayer.align === a
                                    ? "#fff"
                                    : "rgba(255,255,255,0.5)"
                                }
                              />
                            </TouchableOpacity>
                          );
                        })}
                        <TouchableOpacity
                          onPress={() =>
                            updateActiveTextLayer({
                              bold: !activeTextLayer.bold,
                            })
                          }
                          style={[
                            dsk.miniBtn,
                            activeTextLayer.bold && dsk.miniBtnActive,
                          ]}
                        >
                          <Bold
                            size={14}
                            color={
                              activeTextLayer.bold
                                ? "#fff"
                                : "rgba(255,255,255,0.5)"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          updateActiveTextLayer({
                            bgStyle:
                              activeTextLayer.bgStyle === "none"
                                ? "solid"
                                : "none",
                          })
                        }
                        style={[
                          dsk.toggleRow,
                          activeTextLayer.bgStyle === "solid" &&
                            dsk.toggleRowActive,
                        ]}
                      >
                        <Text style={dsk.toggleLabel}>Background</Text>
                        <View
                          style={[
                            dsk.togglePill,
                            activeTextLayer.bgStyle === "solid" &&
                              dsk.togglePillOn,
                          ]}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setWebColorTarget("layer")}
                        style={dsk.colorPickerRow}
                      >
                        <View
                          style={[
                            dsk.colorDot,
                            { backgroundColor: activeTextLayer.color },
                          ]}
                        />
                        <Text style={dsk.colorPickerLabel}>Color</Text>
                      </TouchableOpacity>
                      {webColorTarget === "layer" && (
                        <WebColorPanel
                          visible
                          selected={activeTextLayer.color}
                          onSelect={(c: string) => {
                            updateActiveTextLayer({ color: c });
                            setWebColorTarget(null);
                          }}
                          onClose={() => setWebColorTarget(null)}
                        />
                      )}
                    </View>
                  )}
                </ScrollView>

                <View style={dsk.divider} />

                {/* Done / Cancel */}
                <View style={dsk.sidebarBottom}>
                  <TouchableOpacity
                    onPress={
                      activeTool !== "none" ? handleToolDone : handleDone
                    }
                    style={[dsk.doneBtn, isExporting && { opacity: 0.8 }]}
                    disabled={isExporting}
                  >
                    {isExporting && activeTool === "none" ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={dsk.doneBtnLabel}>
                        {activeTool !== "none" ? "Apply" : "Save"}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={
                      activeTool !== "none" ? handleToolCancel : handleCancel
                    }
                    style={dsk.cancelBtn}
                  >
                    <Text style={dsk.cancelBtnLabel}>
                      {activeTool !== "none" ? "Cancel" : "Discard"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* ── Canvas area ───────────────────────────────────── */}
              <View style={dsk.canvasArea}>
                {/* Top status bar */}
                <View style={dsk.topBar}>
                  <Text style={dsk.topBarTitle}>
                    {activeTool !== "none"
                      ? activeTool.charAt(0).toUpperCase() + activeTool.slice(1)
                      : "Edit Photo"}
                  </Text>
                  {activeTool === "draw" && (
                    <Text style={dsk.topBarHint}>
                      Click and drag to draw · ⌘Z to undo
                    </Text>
                  )}
                  {activeTool === "text" && (
                    <Text style={dsk.topBarHint}>
                      Type on screen · Enter to place · Esc to cancel
                    </Text>
                  )}
                </View>

                {/* Canvas */}
                <View style={dsk.canvasWrapper}>{renderCanvas()}</View>

                {/* Text overlay — same as mobile, works on desktop too */}
                {activeTool === "text" && (
                  <View
                    style={[StyleSheet.absoluteFill, { zIndex: 50 }]}
                    pointerEvents="box-none"
                  >
                    <View
                      style={styles.textOverlayScrim}
                      pointerEvents="none"
                    />
                    <View style={styles.textOverlayCenter} pointerEvents="none">
                      <Text
                        style={[
                          styles.textOverlayPreview,
                          {
                            color: textColor,
                            fontWeight: textBold ? "700" : "400",
                            textAlign: textAlign,
                            backgroundColor:
                              textBgStyle === "solid"
                                ? "rgba(0,0,0,0.55)"
                                : "transparent",
                          },
                        ]}
                      >
                        {editingText || "Type something..."}
                      </Text>
                    </View>
                    <View style={styles.textOverlayBottom}>
                      <View style={styles.textControlsRow}>
                        <TextControlsBar
                          align={textAlign}
                          bgStyle={textBgStyle}
                          color={textColor}
                          bold={textBold}
                          onAlignToggle={() =>
                            setTextAlign((a) =>
                              a === "left"
                                ? "center"
                                : a === "center"
                                  ? "right"
                                  : "left",
                            )
                          }
                          onBgToggle={() =>
                            setTextBgStyle((s) =>
                              s === "none" ? "solid" : "none",
                            )
                          }
                          onBoldToggle={() => setTextBold((b) => !b)}
                          onColorPress={() => setWebColorTarget("text")}
                        />
                      </View>
                      <TextInput
                        style={styles.textOverlayHiddenInput}
                        value={editingText}
                        onChangeText={setEditingText}
                        autoFocus
                        multiline
                        returnKeyType="done"
                        onSubmitEditing={addTextLayer}
                        blurOnSubmit
                        caretHidden={false}
                      />
                    </View>
                  </View>
                )}

                {/* Shortcut hints */}
                {activeTool === "none" && (
                  <View style={dsk.hints}>
                    <Text style={dsk.hintText}>
                      ← Use the sidebar to add text, stickers, or draw
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </GestureDetector>
        </GestureHandlerRootView>

        {/* Crop modal */}
        {showCrop && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
            <ImageCropModal
              visible={showCrop}
              imageUri={currentUri}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              allowRatioChange
              presentationStyle="inline"
              onConfirm={(uri: string) => {
                setCurrentUri(uri);
                setShowCrop(false);
              }}
              onCancel={() => setShowCrop(false)}
            />
          </View>
        )}
      </>
    );
  }

  // ─── MOBILE / EXPO GO LAYOUT ───────────────────────────────────────────────
  return (
    <>
      <StatusBar hidden />
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: EDITOR_BG }}>
        {isExpoGo ? (
          renderExpoGoFallback()
        ) : (
          <GestureDetector gesture={globalTransformGesture}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View style={styles.root}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                  <TouchableOpacity
                    onPress={
                      activeTool !== "none" ? handleToolCancel : handleCancel
                    }
                    style={styles.pillBtn}
                  >
                    {activeTool !== "none" ? (
                      <Text style={styles.pillBtnText}>Cancel</Text>
                    ) : (
                      <X size={18} color="#fff" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                  {activeTool === "none" && (
                    <TouchableOpacity style={styles.pillBtn}>
                      <HelpCircle size={18} color="#fff" strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    onPress={
                      activeTool !== "none" ? handleToolDone : handleDone
                    }
                    style={[
                      styles.pillBtn,
                      styles.doneBtn,
                      isExporting && { opacity: 0.8 },
                    ]}
                    disabled={isExporting}
                  >
                    {isExporting && activeTool === "none" ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.pillBtnText,
                          { color: "#fff", fontWeight: "700" },
                        ]}
                      >
                        Done
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Canvas */}
                <View style={styles.canvasContainer}>{renderCanvas()}</View>

                {/* Draw Toolbar */}
                {activeTool === "draw" && (
                  <DrawToolbar
                    activeBrush={activeBrush}
                    brushColor={brushColor}
                    onBrushChange={setActiveBrush}
                    onColorPress={() => {
                      Keyboard.dismiss();
                      setShowColorSheet(true);
                    }}
                    onUndo={undoLastPath}
                  />
                )}

                {/* Active-layer text controls */}
                {activeTool !== "text" && activeTextLayer && (
                  <View style={styles.aboveToolbarControls}>
                    <TextControlsBar
                      align={activeTextLayer.align}
                      bgStyle={activeTextLayer.bgStyle}
                      color={activeTextLayer.color}
                      bold={activeTextLayer.bold}
                      onAlignToggle={() =>
                        updateActiveTextLayer({
                          align:
                            activeTextLayer.align === "left"
                              ? "center"
                              : activeTextLayer.align === "center"
                                ? "right"
                                : "left",
                        })
                      }
                      onBgToggle={() =>
                        updateActiveTextLayer({
                          bgStyle:
                            activeTextLayer.bgStyle === "none"
                              ? "solid"
                              : "none",
                        })
                      }
                      onBoldToggle={() =>
                        updateActiveTextLayer({ bold: !activeTextLayer.bold })
                      }
                      onColorPress={() => {
                        Keyboard.dismiss();
                        setShowColorSheet(true);
                      }}
                    />
                  </View>
                )}

                {/* Main Bottom Toolbar */}
                {activeTool !== "draw" && activeTool !== "text" && (
                  <View style={styles.bottomToolbar}>
                    {TOOLS.map((tool) => {
                      const IconComp = tool.Icon;
                      const isActive = activeTool === tool.id;
                      return (
                        <TouchableOpacity
                          key={tool.id}
                          onPress={() => handleToolPress(tool.id as EditorTool)}
                          style={styles.toolItem}
                        >
                          <View
                            style={[
                              styles.toolIcon,
                              isActive && styles.toolIconActive,
                            ]}
                          >
                            <IconComp
                              size={22}
                              color="#fff"
                              strokeWidth={isActive ? 2.5 : 1.8}
                            />
                          </View>
                          <Text style={styles.toolLabel}>{tool.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Text Editing Overlay */}
                {activeTool === "text" && (
                  <KeyboardAvoidingView
                    style={[StyleSheet.absoluteFill, { zIndex: 50 }]}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    pointerEvents="box-none"
                  >
                    <View
                      style={styles.textOverlayScrim}
                      pointerEvents="none"
                    />
                    <View style={styles.textOverlayCenter} pointerEvents="none">
                      <Text
                        style={[
                          styles.textOverlayPreview,
                          {
                            color: textColor,
                            fontWeight: textBold ? "700" : "400",
                            textAlign: textAlign,
                            backgroundColor:
                              textBgStyle === "solid"
                                ? "rgba(0,0,0,0.55)"
                                : "transparent",
                          },
                        ]}
                      >
                        {editingText || "Type something..."}
                      </Text>
                    </View>
                    <View style={styles.textOverlayBottom}>
                      <View style={styles.textControlsRow}>
                        <TextControlsBar
                          align={textAlign}
                          bgStyle={textBgStyle}
                          color={textColor}
                          bold={textBold}
                          onAlignToggle={() =>
                            setTextAlign((a) =>
                              a === "left"
                                ? "center"
                                : a === "center"
                                  ? "right"
                                  : "left",
                            )
                          }
                          onBgToggle={() =>
                            setTextBgStyle((s) =>
                              s === "none" ? "solid" : "none",
                            )
                          }
                          onBoldToggle={() => setTextBold((b) => !b)}
                          onColorPress={() => {
                            Keyboard.dismiss();
                            setShowColorSheet(true);
                          }}
                        />
                      </View>
                      <TextInput
                        style={styles.textOverlayHiddenInput}
                        value={editingText}
                        onChangeText={setEditingText}
                        autoFocus
                        multiline
                        returnKeyType="done"
                        onSubmitEditing={addTextLayer}
                        blurOnSubmit
                        caretHidden={false}
                      />
                    </View>
                  </KeyboardAvoidingView>
                )}

                {/* Color sheet + sticker sheet (mobile) */}
                <ColorSheet
                  visible={showColorSheet}
                  selected={
                    activeTool === "draw"
                      ? brushColor
                      : activeTool === "text"
                        ? textColor
                        : activeTextLayer
                          ? activeTextLayer.color
                          : textColor
                  }
                  onSelect={(c: string) => {
                    if (activeTool === "draw") setBrushColor(c);
                    else if (activeTool === "text") setTextColor(c);
                    else if (activeTextLayer)
                      updateActiveTextLayer({ color: c });
                    else setTextColor(c);
                    setShowColorSheet(false);
                  }}
                  onClose={() => setShowColorSheet(false)}
                />
                <StickerSheet
                  visible={showStickerSheet}
                  onSelect={addSticker}
                  onClose={() => setShowStickerSheet(false)}
                />
              </View>
            </KeyboardAvoidingView>
          </GestureDetector>
        )}
      </GestureHandlerRootView>

      {showCrop && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
          <ImageCropModal
            visible={showCrop}
            imageUri={currentUri}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            allowRatioChange
            presentationStyle="inline"
            onConfirm={(uri: string) => {
              setCurrentUri(uri);
              setShowCrop(false);
            }}
            onCancel={() => setShowCrop(false)}
          />
        </View>
      )}
    </>
  );
}

// ─── Tool list (mobile) ───────────────────────────────────────────────────────
const TOOLS = [
  { id: "crop", label: "Size", Icon: Crop },
  { id: "none", label: "Media", Icon: ImageIcon },
  { id: "text", label: "Text", Icon: Type },
  { id: "sticker", label: "Stickers", Icon: Star },
  { id: "draw", label: "Draw", Icon: Paintbrush },
];

// ─── Desktop styles ───────────────────────────────────────────────────────────
const dsk = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: "#0e0e12" },

  // Sidebar
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: SIDEBAR_BG,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    flexDirection: "column",
    paddingTop: 16,
    paddingBottom: 16,
  },
  sidebarTop: { alignItems: "center", paddingBottom: 12 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  toolList: { paddingHorizontal: 8, paddingTop: 8, gap: 2 },

  // Sub-panels
  subPanel: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  subPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subPanelTitle: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  brushRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  brushRowActive: { backgroundColor: "rgba(108,99,255,0.2)" },
  brushRowLabel: { color: "rgba(255,255,255,0.45)", fontSize: 12 },
  colorPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  colorPickerLabel: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
  undoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  undoLabel: { color: "rgba(255,255,255,0.45)", fontSize: 11, flex: 1 },
  shortcut: { color: "rgba(255,255,255,0.2)", fontSize: 10 },
  rowBtns: { flexDirection: "row", gap: 4, marginBottom: 6 },
  miniBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  miniBtnActive: { backgroundColor: ACCENT },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  toggleRowActive: { backgroundColor: "rgba(108,99,255,0.1)" },
  toggleLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  togglePill: {
    width: 28,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  togglePillOn: { backgroundColor: ACCENT },

  // Sidebar bottom
  sidebarBottom: { paddingHorizontal: 10, gap: 6 },
  doneBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  doneBtnLabel: { color: "#fff", fontWeight: "700", fontSize: 13 },
  cancelBtn: {
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelBtnLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12 },

  // Canvas area
  canvasArea: { flex: 1, flexDirection: "column" },
  topBar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  topBarTitle: { color: "#fff", fontWeight: "600", fontSize: 15 },
  topBarHint: { color: "rgba(255,255,255,0.35)", fontSize: 12 },
  canvasWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  canvasInnerDesktop: { boxShadow: "0 8px 40px rgba(0,0,0,0.6)" } as any,

  // Text input row
  textInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "rgba(14,14,18,0.95)",
  },
  textInput: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: BORDER,
  },
  placeBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  placeBtnLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Hints
  hints: { paddingHorizontal: 24, paddingBottom: 16, alignItems: "center" },
  hintText: { color: "rgba(255,255,255,0.2)", fontSize: 12 },
});

// ─── Mobile styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EDITOR_BG },
  canvasInnerDesktop: { boxShadow: "0 8px 40px rgba(0,0,0,0.6)" } as any,
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 32,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    zIndex: 100,
  },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: PILL_GRAY_BG,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
    height: 42,
  },
  pillBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  doneBtn: { backgroundColor: PILL_DONE_BG, paddingHorizontal: 20 },
  canvasContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  canvasInner: { borderRadius: 20, overflow: "hidden", position: "relative" },
  textOverlayText: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stickerEmoji: { fontSize: 52 },
  layerDeleteBtn: {
    position: "absolute",
    top: -12,
    left: -12,
    backgroundColor: "rgba(20,20,20,0.8)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  textOverlayScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 10,
  },
  textOverlayCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 11,
    paddingHorizontal: 24,
  },
  textOverlayPreview: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 40,
  },
  textOverlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 12,
  },
  textControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textOverlayHiddenInput: { height: 1, opacity: 0 },
  aboveToolbarControls: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "rgba(20,20,20,0.85)",
  },
  bottomToolbar: {
    flexDirection: "row",
    backgroundColor: TOOLBAR_BG,
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    justifyContent: "space-around",
  },
  toolItem: { alignItems: "center", gap: 4 },
  toolIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolIconActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  toolLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "500",
  },
  expoGoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: EDITOR_BG,
  },
  expoGoTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  expoGoSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  expoGoBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 32,
    backgroundColor: PILL_DONE_BG,
  },
  expoGoBtnLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
