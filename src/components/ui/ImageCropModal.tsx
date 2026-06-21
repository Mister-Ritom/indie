import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  StyleSheet,
  StatusBar,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_SIZE = SCREEN_WIDTH - 32;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string | null;
  imageWidth: number;
  imageHeight: number;
  onConfirm: (croppedUri: string) => void;
  onCancel: () => void;
}

export function ImageCropModal({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const { colors, typography } = useTheme();

  // ─── Shared values (UI thread) ────────────────────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ─── Reset on open ────────────────────────────────────────────────
  const resetTransform = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);

  useEffect(() => {
    if (visible) resetTransform();
  }, [visible, imageUri]);

  // ─── Aspect ratio helpers (plain numbers, safe in worklets) ──────
  const aspect = imageHeight > 0 ? imageWidth / imageHeight : 1;

  // ─── Gestures ────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      const next = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      scale.value = next;

      const renderedW = CROP_SIZE * next;
      const renderedH = (CROP_SIZE / aspect) * next;
      const maxX = Math.max(0, (renderedW - CROP_SIZE) / 2);
      const maxY = Math.max(0, (renderedH - CROP_SIZE) / 2);
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
      const renderedW = CROP_SIZE * s;
      const renderedH = (CROP_SIZE / aspect) * s;
      const maxX = Math.max(0, (renderedW - CROP_SIZE) / 2);
      const maxY = Math.max(0, (renderedH - CROP_SIZE) / 2);
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

  // ─── Crop & confirm ───────────────────────────────────────────────
  // Reading .value from shared values on the JS thread is always safe & current.
  const handleConfirm = async () => {
    if (!imageUri) return;
    try {
      const s = scale.value;
      const tx = translateX.value;
      const ty = translateY.value;

      const renderedW = CROP_SIZE * s;
      const scaleToSource = imageWidth / renderedW;
      const cropPxSource = CROP_SIZE * scaleToSource;

      const originX = Math.max(
        0,
        imageWidth / 2 + (-tx) * scaleToSource - cropPxSource / 2,
      );
      const originY = Math.max(
        0,
        imageHeight / 2 + (-ty) * scaleToSource - cropPxSource / 2,
      );

      const cropW = Math.min(cropPxSource, imageWidth - originX);
      const cropH = Math.min(cropPxSource, imageHeight - originY);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropW),
              height: Math.round(cropH),
            },
          },
          { resize: { width: 800, height: 800 } },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
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

  const containerHeight = CROP_SIZE / aspect;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={[styles.root, { backgroundColor: '#000' }]}>
        <StatusBar hidden />

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleCancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { fontFamily: typography.families.headingMedium }]}>
            Move and Scale
          </Text>

          <TouchableOpacity
            onPress={handleConfirm}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.useBtn, { color: colors.primary }]}>Use Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Crop viewport */}
        <View style={styles.viewport}>
          <GestureDetector gesture={composed}>
            <View style={styles.gestureZone}>
              <Animated.View
                style={[{ width: CROP_SIZE, height: containerHeight }, animatedStyle]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: CROP_SIZE, height: containerHeight }}
                  contentFit="cover"
                />
              </Animated.View>
            </View>
          </GestureDetector>

          {/* Dimmed areas outside the 1:1 crop square */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* top strip */}
            <View style={[styles.dim, { height: (SCREEN_WIDTH - CROP_SIZE) / 2 }]} />
            {/* bottom strip */}
            <View
              style={[
                styles.dim,
                {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: (SCREEN_WIDTH - CROP_SIZE) / 2,
                },
              ]}
            />
            {/* left strip */}
            <View
              style={[
                styles.dim,
                {
                  position: 'absolute',
                  top: (SCREEN_WIDTH - CROP_SIZE) / 2,
                  bottom: (SCREEN_WIDTH - CROP_SIZE) / 2,
                  left: 0,
                  width: 16,
                },
              ]}
            />
            {/* right strip */}
            <View
              style={[
                styles.dim,
                {
                  position: 'absolute',
                  top: (SCREEN_WIDTH - CROP_SIZE) / 2,
                  bottom: (SCREEN_WIDTH - CROP_SIZE) / 2,
                  right: 0,
                  width: 16,
                },
              ]}
            />
          </View>

          {/* Crop frame */}
          <View pointerEvents="none" style={styles.cropFrame}>
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

        {/* Hint */}
        <Text style={styles.hint}>Pinch to zoom · Drag to reposition</Text>
      </View>
    </Modal>
  );
}

const CORNER = 20;
const CORNER_T = 3;
const PAD = 16; // matches CROP_SIZE padding

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
    zIndex: 10,
  },
  title: {
    color: '#fff',
    fontSize: 16,
  },
  cancelBtn: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  useBtn: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewport: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gestureZone: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    left: 0,
    right: 0,
  },
  cropFrame: {
    position: 'absolute',
    left: PAD,
    top: 0,
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#fff',
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: CORNER_T, borderLeftWidth: CORNER_T },
  cornerTR: { top: -1, right: -1, borderTopWidth: CORNER_T, borderRightWidth: CORNER_T },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: CORNER_T, borderLeftWidth: CORNER_T },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: CORNER_T, borderRightWidth: CORNER_T },
  gridH1: {
    position: 'absolute',
    left: 0, right: 0, top: '33.33%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridH2: {
    position: 'absolute',
    left: 0, right: 0, top: '66.66%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridV1: {
    position: 'absolute',
    top: 0, bottom: 0, left: '33.33%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridV2: {
    position: 'absolute',
    top: 0, bottom: 0, left: '66.66%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  hint: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
});
