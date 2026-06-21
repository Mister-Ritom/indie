import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  clamp,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '@/hooks/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_WIDTH = SCREEN_WIDTH - 32;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

// ─── Aspect ratio presets ───────────────────────────────────────────────────
interface AspectRatioOption {
  label: string;
  value: number | null; // null = Original (preserve source aspect)
}

const RATIO_OPTIONS: AspectRatioOption[] = [
  { label: 'Original', value: null },
  { label: '9:16', value: 9 / 16 },
  { label: '2:3', value: 2 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:5', value: 4 / 5 },
  { label: '1:1', value: 1 },
];

// ─── Props ──────────────────────────────────────────────────────────────────
interface ImageCropModalProps {
  visible: boolean;
  imageUri: string | null;
  imageWidth: number;
  imageHeight: number;
  onConfirm: (croppedUri: string) => void;
  onCancel: () => void;
  /** When true, shows the horizontal aspect-ratio picker. Default: false (locked 1:1). */
  allowRatioChange?: boolean;
  /** Initial aspect ratio to use. Default: 1 (1:1). Ignored when allowRatioChange=true. */
  initialAspectRatio?: number;
  /** Whether to render as a full-screen Modal or an inline view. Default: 'modal'. */
  presentationStyle?: 'modal' | 'inline';
}

export function ImageCropModal({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  onConfirm,
  onCancel,
  allowRatioChange = false,
  initialAspectRatio = 1,
  presentationStyle = 'modal',
}: ImageCropModalProps) {
  const { colors, typography } = useTheme();

  // ─── Selected crop ratio ─────────────────────────────────────────────────
  // null means "Original" — use the source image aspect ratio
  const [selectedRatio, setSelectedRatio] = useState<number | null>(
    allowRatioChange ? null : initialAspectRatio,
  );

  // The actual aspect ratio used for the crop window (width / height)
  const sourceAspect = imageHeight > 0 ? imageWidth / imageHeight : 1;
  const cropAspect = selectedRatio !== null ? selectedRatio : sourceAspect;

  // Viewport height for the crop window
  const cropViewportH = CROP_WIDTH / cropAspect;

  // ─── Shared values (UI thread) ───────────────────────────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ─── Reset on open / ratio change ───────────────────────────────────────
  const resetTransform = useCallback(() => {
    'worklet';
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);

  useEffect(() => {
    if (visible) {
      resetTransform();
      if (allowRatioChange) setSelectedRatio(null);
    }
  }, [visible, imageUri]);

  useEffect(() => {
    resetTransform();
  }, [selectedRatio]);

  // ─── Gestures ────────────────────────────────────────────────────────────
  // We pass cropAspect as a plain number (captured in closure) so it is
  // safely readable in worklets without serialisation issues.
  const localCropAspect = cropAspect;

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      const next = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      scale.value = next;

      const renderedW = CROP_WIDTH * next;
      const renderedH = (CROP_WIDTH / localCropAspect) * next;
      const maxX = Math.max(0, (renderedW - CROP_WIDTH) / 2);
      const maxY = Math.max(0, (renderedH - CROP_WIDTH / localCropAspect) / 2);
      translateX.value = clamp(translateX.value, -maxX, maxX);
      translateY.value = clamp(translateY.value, -maxY, maxY);
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      const s = scale.value;
      const renderedW = CROP_WIDTH * s;
      const renderedH = (CROP_WIDTH / localCropAspect) * s;
      const cropH = CROP_WIDTH / localCropAspect;
      const maxX = Math.max(0, (renderedW - CROP_WIDTH) / 2);
      const maxY = Math.max(0, (renderedH - cropH) / 2);
      translateX.value = clamp(savedTranslateX.value + e.translationX, -maxX, maxX);
      translateY.value = clamp(savedTranslateY.value + e.translationY, -maxY, maxY);
    })
    .onEnd(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ─── Crop & confirm ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!imageUri) return;
    try {
      const s = scale.value;
      const tx = translateX.value;
      const ty = translateY.value;

      // The image is rendered at CROP_WIDTH wide, height = CROP_WIDTH / sourceAspect
      const renderedW = CROP_WIDTH * s;
      const scaleToSource = imageWidth / renderedW;

      // Crop window size in source pixels
      const cropWSource = CROP_WIDTH * scaleToSource;
      const cropHSource = (CROP_WIDTH / cropAspect) * scaleToSource;

      // Image centre in screen coords = (0, 0) because it's centred.
      // The crop window centre is also (0, 0) in the viewport.
      // Offset by the translate to find top-left.
      const originX = Math.max(
        0,
        imageWidth / 2 + (-tx) * scaleToSource - cropWSource / 2,
      );
      const originY = Math.max(
        0,
        imageHeight / 2 + (-ty) * scaleToSource - cropHSource / 2,
      );

      const finalW = Math.min(cropWSource, imageWidth - originX);
      const finalH = Math.min(cropHSource, imageHeight - originY);

      // Output size: keep width at 1080, derive height from ratio
      const outWidth = 1080;
      const outHeight = Math.round(outWidth / cropAspect);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(finalW),
              height: Math.round(finalH),
            },
          },
          { resize: { width: outWidth, height: outHeight } },
        ],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
      );

      onConfirm(result.uri);
    } catch (err) {
      console.error('Crop failed:', err);
      onConfirm(imageUri);
    }
  };

  const handleCancel = () => {
    resetTransform();
    onCancel();
  };

  if (!imageUri) return null;

  // Height of the full-resolution image rendered at CROP_WIDTH
  const renderedImageH = CROP_WIDTH / sourceAspect;

  const content = (
    <View style={[styles.root, { backgroundColor: '#111' }]}>
      {presentationStyle === 'modal' && <StatusBar hidden />}

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.topBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { fontFamily: typography.families.headingMedium }]}>
          {allowRatioChange ? 'Crop' : 'Move and Scale'}
        </Text>

        <TouchableOpacity
          onPress={handleConfirm}
          style={styles.topBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.useBtn, { color: colors.primary }]}>Done</Text>
        </TouchableOpacity>
      </View>

        {/* Tip */}
        {allowRatioChange && (
          <Text style={styles.tip}>
            Tip: fully vertical Pins get more engagement
          </Text>
        )}

        {/* Crop viewport */}
        <View style={[styles.viewport, { height: cropViewportH }]}>
          <GestureDetector gesture={composed}>
            <View style={[styles.gestureZone, { height: cropViewportH }]}>
              <Animated.View
                style={[
                  { width: CROP_WIDTH, height: renderedImageH },
                  animatedStyle,
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: CROP_WIDTH, height: renderedImageH }}
                  contentFit="cover"
                />
              </Animated.View>
            </View>
          </GestureDetector>

          {/* Crop frame corners */}
          <View pointerEvents="none" style={[styles.cropFrame, { height: cropViewportH }]}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <View style={styles.gridH1} />
            <View style={styles.gridH2} />
            <View style={styles.gridV1} />
            <View style={styles.gridV2} />
          </View>
        </View>

        {/* Dimmed outside */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* Top dim */}
          <View
            style={[
              styles.dim,
              { height: (SCREEN_HEIGHT - cropViewportH) / 2, top: 0 },
            ]}
          />
          {/* Bottom dim */}
          <View
            style={[
              styles.dim,
              {
                height: (SCREEN_HEIGHT - cropViewportH) / 2,
                bottom: 0,
                position: 'absolute',
                left: 0,
                right: 0,
              },
            ]}
          />
        </View>

        {/* Aspect ratio picker */}
        {allowRatioChange && (
          <View style={styles.ratioPickerContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ratioPickerScroll}
            >
              {RATIO_OPTIONS.map((opt) => {
                const isSelected =
                  opt.value === selectedRatio ||
                  (opt.value === null && selectedRatio === null);
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => setSelectedRatio(opt.value)}
                    style={[
                      styles.ratioBtn,
                      isSelected && styles.ratioBtnSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ratioBtnText,
                        isSelected && styles.ratioBtnTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

      {/* Hint for profile flow */}
      {!allowRatioChange && (
        <Text style={styles.hint}>Pinch to zoom · Drag to reposition</Text>
      )}
    </View>
  );

  if (presentationStyle === 'inline') {
    if (!visible) return null;
    return <View style={StyleSheet.absoluteFill}>{content}</View>;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      {content}
    </Modal>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CORNER_SZ = 20;
const CORNER_T = 3;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  topBtn: {
    minWidth: 60,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  cancelBtn: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  useBtn: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  tip: {
    position: 'absolute',
    bottom: 130,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    zIndex: 10,
  },
  viewport: {
    width: CROP_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 12,
  },
  gestureZone: {
    width: CROP_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    left: 0,
    right: 0,
  },
  cropFrame: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CROP_WIDTH,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SZ,
    height: CORNER_SZ,
    borderColor: '#fff',
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: CORNER_T, borderLeftWidth: CORNER_T },
  cornerTR: { top: -1, right: -1, borderTopWidth: CORNER_T, borderRightWidth: CORNER_T },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: CORNER_T, borderLeftWidth: CORNER_T },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: CORNER_T, borderRightWidth: CORNER_T },
  gridH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33.33%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '66.66%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33.33%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '66.66%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  hint: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  ratioPickerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 0,
    right: 0,
  },
  ratioPickerScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratioBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  ratioBtnSelected: {
    backgroundColor: '#fff',
  },
  ratioBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '500',
  },
  ratioBtnTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
});
