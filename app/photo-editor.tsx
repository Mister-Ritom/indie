/**
 * photo-editor.tsx
 *
 * Full-screen Pinterest-style photo editor screen.
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  View, Text, Platform, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Dimensions, StatusBar, KeyboardAvoidingView
} from "react-native";
import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { captureRef } from "react-native-view-shot";

import { useEditorStore } from "@/stores/editorStore";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import {
  COLOR_PALETTE, BRUSH_CONFIGS, STICKER_ROWS, DEFAULT_DRAW_COLOR,
  EDITOR_BG, TOOLBAR_BG, PILL_DONE_BG, PILL_GRAY_BG
} from "@/components/ui/editor/editorConstants";
import type { DrawPath, TextLayer, StickerLayer, EditorTool, BrushType } from "@/components/ui/editor/editorTypes";

const isExpoGo =
  Platform.OS !== "web" &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const { width: SW, height: SH } = Dimensions.get("window");

const CANVAS_W = SW;
const CANVAS_H = Math.round(SW * (4 / 3));

let SkiaEditorCanvasComponent:
  | typeof import("@/components/ui/editor/SkiaEditorCanvas").SkiaEditorCanvas
  | null = null;
if (!isExpoGo) {
  SkiaEditorCanvasComponent = require("@/components/ui/editor/SkiaEditorCanvas").SkiaEditorCanvas;
}

let _idCounter = 0;
const uid = () => `${Date.now()}_${_idCounter++}`;

function ColorSheet({ visible, selected, onSelect, onClose }: any) {
  if (!visible) return null;
  return (
    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
      <View style={cs.sheet} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={cs.grid}>
            <View style={cs.row}>
              <TouchableOpacity style={[cs.swatch, cs.eyedropper]} onPress={onClose}>
                <Text style={{ fontSize: 18 }}>🎨</Text>
              </TouchableOpacity>
              {COLOR_PALETTE.slice(0, 6).map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => onSelect(c)}
                  style={[cs.swatch, { backgroundColor: c }, selected === c && cs.swatchSelected]}
                />
              ))}
            </View>
            {[7, 14, 21, 28].map((start) => (
              <View key={start} style={cs.row}>
                {COLOR_PALETTE.slice(start, start + 7).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => onSelect(c)}
                    style={[cs.swatch, { backgroundColor: c }, selected === c && cs.swatchSelected]}
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
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(28,28,28,0.98)", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 36 : 24, paddingHorizontal: 12 },
  grid: { gap: 8 },
  row: { flexDirection: "row", gap: 8, justifyContent: "center" },
  swatch: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)" },
  swatchSelected: { borderWidth: 3, borderColor: "#fff" },
  eyedropper: { backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
});

function StickerSheet({ visible, onSelect, onClose }: any) {
  if (!visible) return null;
  return (
    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
      <View style={ss.sheet} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <Text style={ss.heading}>Stickers</Text>
          <ScrollView>
            {STICKER_ROWS.map((row, ri) => (
              <View key={ri} style={ss.row}>
                {row.map((emoji) => (
                  <TouchableOpacity key={emoji} onPress={() => { onSelect(emoji); onClose(); }} style={ss.emojiBtn}>
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
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(28,28,28,0.98)", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingBottom: Platform.OS === "ios" ? 36 : 24, paddingHorizontal: 16, maxHeight: SH * 0.55 },
  heading: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-evenly", marginBottom: 8 },
  emojiBtn: { padding: 6, borderRadius: 10 },
  emoji: { fontSize: 34 },
});

function DrawToolbar({ activeBrush, brushColor, onBrushChange, onColorPress, onUndo }: any) {
  const ICONS: any = { marker: "✏️", highlighter: "🖌️", pen: "🖊️", ink: "🖋️", eraser: "⬜" };
  return (
    <View style={dt.container}>
      <TouchableOpacity onPress={onUndo} style={dt.undoBtn}><Text style={{ color: "#fff", fontSize: 18 }}>↩</Text></TouchableOpacity>
      {BRUSH_CONFIGS.map((cfg) => (
        <TouchableOpacity key={cfg.type} onPress={() => onBrushChange(cfg.type)} style={dt.brushBtn}>
          <Text style={[dt.brushIcon, activeBrush === cfg.type && dt.brushIconActive]}>{ICONS[cfg.type]}</Text>
          {activeBrush === cfg.type && <View style={dt.brushUnderline} />}
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={onColorPress} style={dt.colorBtn}>
        <View style={[dt.colorCircle, { backgroundColor: brushColor }]} />
      </TouchableOpacity>
    </View>
  );
}

const dt = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, backgroundColor: TOOLBAR_BG },
  undoBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  brushBtn: { alignItems: "center", justifyContent: "center", paddingBottom: 4 },
  brushIcon: { fontSize: 26, opacity: 0.45 },
  brushIconActive: { opacity: 1 },
  brushUnderline: { height: 2, width: 24, backgroundColor: "#fff", borderRadius: 1, marginTop: 3 },
  colorBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#fff", overflow: "hidden" },
  colorCircle: { flex: 1 },
});

function TextControlsBar({ align, bgStyle, color, bold, onAlignToggle, onBgToggle, onBoldToggle, onColorPress }: any) {
  return (
    <View style={tcb.bar}>
      <TouchableOpacity onPress={onBgToggle} style={[tcb.btn, bgStyle === "solid" && tcb.btnActive]}>
        <View style={tcb.bgCircle} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onAlignToggle} style={tcb.btn}>
        <Text style={tcb.btnIcon}>☰</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onBoldToggle} style={[tcb.btn, bold && tcb.btnActive]}>
        <Text style={[tcb.btnIcon, { fontWeight: "900" }]}>A</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onColorPress} style={tcb.colorBtn}>
        <View style={[tcb.colorDot, { backgroundColor: color }]} />
      </TouchableOpacity>
    </View>
  );
}

const tcb = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(40,40,40,0.9)", borderRadius: 32, alignSelf: "flex-start", marginLeft: 12, marginBottom: 8 },
  btn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  btnActive: { backgroundColor: "#fff" },
  btnIcon: { color: "#fff", fontSize: 18, fontWeight: "600" },
  bgCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  colorBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#fff", overflow: "hidden" },
  colorDot: { flex: 1 },
});

function DraggableText({ layer, isExporting, onUpdatePosition }: any) {
  const transX = useSharedValue(layer.x);
  const transY = useSharedValue(layer.y);

  const pan = Gesture.Pan()
    .onChange((e) => {
      transX.value += e.changeX;
      transY.value += e.changeY;
    })
    .onEnd(() => {
      runOnJS(onUpdatePosition)(layer.id, transX.value, transY.value);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const estimatedWidth = layer.text.length * layer.fontSize * 0.6;
    const estimatedHeight = layer.fontSize * 1.4;

    let textX = transX.value;
    if (layer.align === "center") textX = transX.value - estimatedWidth / 2;
    if (layer.align === "right") textX = transX.value - estimatedWidth;

    return {
      position: "absolute",
      left: textX,
      top: transY.value - estimatedHeight,
      opacity: isExporting && Platform.OS === 'web' ? 0 : 1, // hide on web during export so Skia renders it
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>
        <Text
          style={[
            styles.textOverlayText,
            {
              color: layer.color,
              fontSize: layer.fontSize,
              fontWeight: layer.bold ? "700" : "400",
              textAlign: layer.align,
              backgroundColor: layer.bgStyle === "solid" ? "rgba(0,0,0,0.5)" : "transparent",
            },
          ]}
        >
          {layer.text}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

function DraggableSticker({ layer, isExporting, onUpdateLayer }: any) {
  const transX = useSharedValue(layer.x);
  const transY = useSharedValue(layer.y);
  const scale = useSharedValue(layer.scale);
  const savedScale = useSharedValue(layer.scale);

  const pan = Gesture.Pan()
    .onChange((e) => { transX.value += e.changeX; transY.value += e.changeY; })
    .onEnd(() => { runOnJS(onUpdateLayer)(layer.id, transX.value, transY.value, scale.value); });

  const pinch = Gesture.Pinch()
    .onChange((e) => { scale.value = Math.max(0.3, Math.min(4, savedScale.value * e.scale)); })
    .onEnd(() => { savedScale.value = scale.value; runOnJS(onUpdateLayer)(layer.id, transX.value, transY.value, scale.value); });

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: transX.value,
    top: transY.value - 40,
    transform: [{ scale: scale.value }],
    opacity: isExporting && Platform.OS === 'web' ? 0 : 1, // hide on web during export so Skia renders it
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
      <Animated.View style={animatedStyle}>
        <Text style={styles.stickerEmoji}>{layer.emoji}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

export default function PhotoEditorScreen() {
  const { originalUri: imageUri, imageWidth, imageHeight, setEditedImage } = useEditorStore();

  const [activeTool, setActiveTool] = useState<EditorTool>("none");
  const [showCrop, setShowCrop] = useState(false);
  const [showColorSheet, setShowColorSheet] = useState(false);
  const [showStickerSheet, setShowStickerSheet] = useState(false);

  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [initialDrawPaths, setInitialDrawPaths] = useState<DrawPath[]>([]); // For cancel
  const [activeBrush, setActiveBrush] = useState<BrushType>("marker");
  const [brushColor, setBrushColor] = useState(DEFAULT_DRAW_COLOR);
  const currentPathRef = useRef<DrawPath | null>(null);

  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [editingText, setEditingText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textBold, setTextBold] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [textBgStyle, setTextBgStyle] = useState<"none" | "solid">("none");

  const [stickerLayers, setStickerLayers] = useState<StickerLayer[]>([]);
  const [currentUri, setCurrentUri] = useState(imageUri || "");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (imageUri && !currentUri) {
      setCurrentUri(imageUri);
    }
  }, [imageUri, currentUri]);

  const captureViewRef = useRef<View>(null);
  const canvasRef = useRef<import("@/components/ui/editor/SkiaEditorCanvas").SkiaEditorCanvasHandle>(null);

  const brushConfig = useMemo(() => BRUSH_CONFIGS.find((b) => b.type === activeBrush)!, [activeBrush]);

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
    [activeTool, brushColor, brushConfig, activeBrush]
  );

  const addTextLayer = useCallback(() => {
    if (!editingText.trim()) {
      setActiveTool("none");
      return;
    }
    const newLayer: TextLayer = {
      id: uid(),
      text: editingText.trim(),
      x: CANVAS_W / 2,
      y: CANVAS_H / 2,
      color: textColor,
      fontSize: 32,
      bold: textBold,
      align: textAlign,
      bgStyle: textBgStyle,
    };
    setTextLayers((prev) => [...prev, newLayer]);
    setEditingText("");
    setActiveTool("none");
  }, [editingText, textColor, textBold, textAlign, textBgStyle]);

  const handleToolCancel = useCallback(() => {
    if (activeTool === "draw") {
      setDrawPaths(initialDrawPaths);
    } else if (activeTool === "text") {
      setEditingText("");
    }
    setActiveTool("none");
  }, [activeTool, initialDrawPaths]);

  const handleToolDone = useCallback(() => {
    if (activeTool === "text") {
      addTextLayer();
    } else {
      setActiveTool("none");
    }
  }, [activeTool, addTextLayer]);

  const updateTextPosition = useCallback((id: string, x: number, y: number) => {
    setTextLayers((prev) => prev.map((l) => (l.id === id ? { ...l, x, y } : l)));
  }, []);

  const addSticker = useCallback((emoji: string) => {
    const newSticker: StickerLayer = { id: uid(), emoji, x: CANVAS_W / 2 - 30, y: CANVAS_H / 2 - 30, scale: 1, rotation: 0 };
    setStickerLayers((prev) => [...prev, newSticker]);
  }, []);

  const updateStickerLayer = useCallback((id: string, x: number, y: number, scale: number) => {
    setStickerLayers((prev) => prev.map((sl) => (sl.id === id ? { ...sl, x, y, scale } : sl)));
  }, []);

  const undoLastPath = useCallback(() => {
    setDrawPaths((prev) => prev.slice(0, -1));
  }, []);

  const handleDone = useCallback(async () => {
    if (Platform.OS === 'web') {
      setIsExporting(true);
      setTimeout(() => {
        const base64 = canvasRef.current?.exportAsBase64();
        if (base64) {
          setEditedImage(`data:image/jpeg;base64,${base64}`);
        } else {
          setEditedImage(currentUri);
        }
        setIsExporting(false);
        router.back();
      }, 100);
      return;
    }

    if (!captureViewRef.current) {
      setEditedImage(currentUri);
      router.back();
      return;
    }

    try {
      // Use high quality export as per user request
      const uri = await captureRef(captureViewRef, {
        format: "jpg",
        quality: 1,
      });
      setEditedImage(uri);
      router.back();
    } catch (err) {
      console.error("Export failed:", err);
      setEditedImage(currentUri);
      router.back();
    }
  }, [currentUri, setEditedImage]);

  const handleToolPress = (tool: EditorTool) => {
    if (tool === "crop") {
      setShowCrop(true);
      return;
    }
    if (tool === "sticker") {
      setShowStickerSheet(true);
      return;
    }
    if (tool === "draw") {
      setInitialDrawPaths([...drawPaths]);
    }
    setActiveTool((prev) => (prev === tool ? "none" : tool));
  };

  const handleCancel = () => {
    router.back();
  };

  const renderExpoGoFallback = () => (
    <View style={styles.expoGoFallback}>
      <Text style={styles.expoGoTitle}>Photo Editor</Text>
      <Text style={styles.expoGoSubtitle}>The photo editor requires a development build and is not available in Expo Go.</Text>
      <TouchableOpacity style={styles.expoGoBtn} onPress={handleCancel}>
        <Text style={styles.expoGoBtnLabel}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <StatusBar hidden />
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: EDITOR_BG }}>
        {isExpoGo ? (
          renderExpoGoFallback()
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.root}>
              {/* ── Top Bar ─────────────────────────────────────────── */}
              <View style={styles.topBar}>
                <TouchableOpacity onPress={activeTool !== "none" ? handleToolCancel : handleCancel} style={styles.pillBtn}>
                  <Text style={styles.pillBtnText}>{activeTool !== "none" ? "Cancel" : "✕"}</Text>
                </TouchableOpacity>
                {activeTool === "none" && (
                  <TouchableOpacity style={styles.pillBtn}>
                    <Text style={styles.pillBtnText}>?</Text>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={activeTool !== "none" ? handleToolDone : handleDone} style={[styles.pillBtn, styles.doneBtn]}>
                  <Text style={[styles.pillBtnText, { color: "#fff", fontWeight: "700" }]}>
                    {activeTool !== "none" ? "Done" : "Done"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Canvas Area ─────────────────────────────────────── */}
              <View style={styles.canvasContainer}>
                <GestureDetector gesture={activeTool === "draw" ? drawGesture : Gesture.Pan().enabled(false)}>
                  <View style={styles.canvasInner} ref={captureViewRef} collapsable={false}>
                    {SkiaEditorCanvasComponent && currentUri ? (
                      <SkiaEditorCanvasComponent
                        ref={canvasRef}
                        imageUri={currentUri}
                        canvasWidth={CANVAS_W}
                        canvasHeight={CANVAS_H}
                        drawPaths={drawPaths}
                        textLayers={isExporting && Platform.OS === 'web' ? textLayers : []}
                        stickerLayers={isExporting && Platform.OS === 'web' ? stickerLayers : []}
                      />
                    ) : null}

                    {textLayers.map((layer) => (
                      <DraggableText key={layer.id} layer={layer} isExporting={isExporting} onUpdatePosition={updateTextPosition} />
                    ))}

                    {stickerLayers.map((sticker) => (
                      <DraggableSticker key={sticker.id} layer={sticker} isExporting={isExporting} onUpdateLayer={updateStickerLayer} />
                    ))}
                  </View>
                </GestureDetector>
              </View>

              {/* ── Text Input Mode ────────────────────────────────── */}
              {activeTool === "text" && (
                <View style={styles.textInputContainer}>
                  <TextControlsBar
                    align={textAlign} bgStyle={textBgStyle} color={textColor} bold={textBold}
                    onAlignToggle={() => setTextAlign((a) => a === "left" ? "center" : a === "center" ? "right" : "left")}
                    onBgToggle={() => setTextBgStyle((s) => (s === "none" ? "solid" : "none"))}
                    onBoldToggle={() => setTextBold((b) => !b)}
                    onColorPress={() => setShowColorSheet(true)}
                  />
                  <TextInput
                    style={[styles.textInput, { color: textColor, fontWeight: textBold ? "700" : "400", textAlign: textAlign }]}
                    value={editingText}
                    onChangeText={setEditingText}
                    placeholder="Type something..."
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    autoFocus
                    multiline
                    returnKeyType="done"
                    onSubmitEditing={addTextLayer}
                    blurOnSubmit
                  />
                </View>
              )}

              {/* ── Draw Toolbar ────────────────────────────────────── */}
              {activeTool === "draw" && (
                <DrawToolbar activeBrush={activeBrush} brushColor={brushColor} onBrushChange={setActiveBrush} onColorPress={() => setShowColorSheet(true)} onUndo={undoLastPath} />
              )}

              {/* ── Main Bottom Toolbar (6 tools) ───────────────────── */}
              {activeTool !== "draw" && activeTool !== "text" && (
                <View style={styles.bottomToolbar}>
                  {TOOLS.map((tool) => (
                    <TouchableOpacity key={tool.id} onPress={() => handleToolPress(tool.id as EditorTool)} style={styles.toolItem}>
                      <View style={[styles.toolIcon, activeTool === tool.id && styles.toolIconActive]}>
                        <Text style={styles.toolEmoji}>{tool.emoji}</Text>
                      </View>
                      <Text style={styles.toolLabel}>{tool.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <ColorSheet visible={showColorSheet} selected={activeTool === "draw" ? brushColor : textColor} onSelect={(c: string) => { if (activeTool === "draw") setBrushColor(c); else setTextColor(c); setShowColorSheet(false); }} onClose={() => setShowColorSheet(false)} />
              <StickerSheet visible={showStickerSheet} onSelect={addSticker} onClose={() => setShowStickerSheet(false)} />
            </View>
          </KeyboardAvoidingView>
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
            onConfirm={(uri: string) => { setCurrentUri(uri); setShowCrop(false); }}
            onCancel={() => setShowCrop(false)}
          />
        </View>
      )}
    </>
  );
}

const TOOLS = [
  { id: "crop", label: "Size", emoji: "⬛" },
  { id: "none", label: "Media", emoji: "🖼️" },
  { id: "text", label: "Text", emoji: "🔤" },
  { id: "sticker", label: "Stickers", emoji: "⭐" },
  { id: "draw", label: "Draw", emoji: "🎨" },
];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EDITOR_BG },
  topBar: { flexDirection: "row", alignItems: "center", paddingTop: Platform.OS === "ios" ? 56 : 32, paddingHorizontal: 16, paddingBottom: 12, gap: 8, zIndex: 10 },
  pillBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, backgroundColor: PILL_GRAY_BG, alignItems: "center", justifyContent: "center", minWidth: 44 },
  pillBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  doneBtn: { backgroundColor: PILL_DONE_BG, paddingHorizontal: 20 },
  canvasContainer: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  canvasInner: { width: CANVAS_W, height: CANVAS_H, borderRadius: 20, overflow: "hidden", position: "relative" },
  textOverlayText: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  stickerEmoji: { fontSize: 52 },
  textInputContainer: { backgroundColor: "rgba(20,20,20,0.92)", paddingTop: 8 },
  textInput: { marginHorizontal: 12, fontSize: 22, color: "#fff", minHeight: 48, maxHeight: 120, paddingHorizontal: 12, paddingVertical: 8 },
  bottomToolbar: { flexDirection: "row", backgroundColor: TOOLBAR_BG, paddingVertical: 12, paddingHorizontal: 8, paddingBottom: Platform.OS === "ios" ? 32 : 16, justifyContent: "space-around" },
  toolItem: { alignItems: "center", gap: 4 },
  toolIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  toolIconActive: { backgroundColor: "rgba(255,255,255,0.28)", borderWidth: 2, borderColor: "#fff" },
  toolEmoji: { fontSize: 22 },
  toolLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "500" },
  expoGoFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: EDITOR_BG },
  expoGoTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 12 },
  expoGoSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  expoGoBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 32, backgroundColor: PILL_DONE_BG },
  expoGoBtnLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
