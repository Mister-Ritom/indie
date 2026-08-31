import React, { useEffect, useRef, useState, memo } from 'react';
import {
  View,
  Text,
  Image,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AD_UNITS } from '@/utils/constants';
import { SkeletonPinCard } from './SkeletonPinCard';

// ---------------------------------------------------------------------------
// Conditional require — keeps the module from crashing on web / Expo Go where
// the native module is not linked. All symbols are null in that case and
// the component returns null early.
// ---------------------------------------------------------------------------
let NativeAdView: any = null;
let NativeMediaView: any = null;
let NativeAsset: any = null;
let NativeAssetType: any = null;
let NativeAdClass: any = null;
let TestIds: any = null;

try {
  const m = require('react-native-google-mobile-ads');
  NativeAdView = m.NativeAdView;
  NativeMediaView = m.NativeMediaView;
  NativeAsset = m.NativeAsset;
  NativeAssetType = m.NativeAssetType;
  NativeAdClass = m.NativeAd;
  TestIds = m.TestIds;
} catch {
  // web or Expo Go — native module not available
}

// ---------------------------------------------------------------------------
// Ad unit ID: test IDs in __DEV__, production IDs from constants in release
// ---------------------------------------------------------------------------
function getAdUnitId(): string {
  if (__DEV__ && TestIds) {
    return TestIds.NATIVE as string;
  }
  return Platform.OS === 'ios'
    ? AD_UNITS.ios.homeNative
    : AD_UNITS.android.homeNative;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface NativeAdCardProps {
  columnWidth: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function NativeAdCardInner({ columnWidth }: NativeAdCardProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const [nativeAd, setNativeAd] = useState<any>(null);
  const [hasError, setHasError] = useState(false);
  const adRef = useRef<any>(null);

  const nativeModuleAvailable =
    NativeAdView !== null &&
    NativeMediaView !== null &&
    NativeAsset !== null &&
    NativeAssetType !== null &&
    NativeAdClass !== null;

  useEffect(() => {
    if (!nativeModuleAvailable) return;

    let cancelled = false;

    const load = async () => {
      try {
        const ad = await NativeAdClass.createForAdRequest(getAdUnitId());
        if (cancelled) {
          ad.destroy();
          return;
        }
        adRef.current = ad;
        setNativeAd(ad);
      } catch {
        if (!cancelled) setHasError(true);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (adRef.current) {
        adRef.current.destroy();
        adRef.current = null;
      }
    };
  }, [nativeModuleAvailable]);

  // If native module is missing or loading failed, render nothing
  if (!nativeModuleAvailable || hasError) {
    return null;
  }

  // While loading, render a skeleton card with an assumed height so the
  // masonry grid does not suffer a sudden 0 -> height layout shift / flash
  if (!nativeAd) {
    return <SkeletonPinCard columnWidth={columnWidth} index={1} />;
  }

  // Mirror PinCard height cap: clamp aspect ratio between 0.5 and 1.8
  const rawAspectRatio: number =
    nativeAd.mediaContent?.aspectRatio && nativeAd.mediaContent.aspectRatio > 0
      ? nativeAd.mediaContent.aspectRatio
      : 1.0;
  const aspectRatio = Math.min(Math.max(rawAspectRatio, 0.5), 1.8);
  const mediaHeight = Math.round(columnWidth / aspectRatio);

  return (
    <NativeAdView
      nativeAd={nativeAd}
      style={{
        width: columnWidth,
        marginBottom: spacing.sm,
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      {/* ── Media region ────────────────────────────────────────────── */}
      <View
        style={{
          width: columnWidth,
          height: mediaHeight,
          backgroundColor: colors.skeleton,
          borderRadius: radius.lg,
          overflow: 'hidden',
        }}
      >
        <NativeAsset assetType={NativeAssetType.IMAGE}>
          <NativeMediaView
            resizeMode="cover"
            style={{ width: columnWidth, height: mediaHeight }}
          />
        </NativeAsset>

        {/* Sponsored badge — always visible, clearly labels this as an ad */}
        <View
          style={{
            position: 'absolute',
            top: spacing.sm,
            left: spacing.sm,
            backgroundColor: colors.primary,
            borderRadius: radius.xs,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
          pointerEvents="none"
        >
          <Text
            style={{
              fontFamily: typography.families.bodyBold,
              fontSize: typography.scale.tiny,
              color: '#fff',
              letterSpacing: 0.5,
            }}
          >
            Sponsored
          </Text>
        </View>
      </View>

      {/* ── Card footer ─────────────────────────────────────────────── */}
      <View
        style={{
          padding: spacing.sm,
          paddingHorizontal: spacing.sm + 2,
        }}
      >
        {/* Headline */}
        {nativeAd.headline ? (
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: typography.families.bodyMedium,
                fontSize: typography.scale.bodySmall,
                color: colors.text,
                marginBottom: 4,
              }}
            >
              {nativeAd.headline}
            </Text>
          </NativeAsset>
        ) : null}

        {/* Body */}
        {nativeAd.body ? (
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: typography.families.body,
                fontSize: typography.scale.caption,
                color: colors.textSecondary,
                marginBottom: 6,
              }}
            >
              {nativeAd.body}
            </Text>
          </NativeAsset>
        ) : null}

        {/* Author row: icon + advertiser name + CTA */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 2,
            gap: 6,
          }}
        >
          {/* Advertiser icon + name */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              flex: 1,
            }}
          >
            {nativeAd.icon?.url ? (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image
                  source={{ uri: nativeAd.icon.url }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: radius.xs,
                  }}
                  resizeMode="cover"
                />
              </NativeAsset>
            ) : null}

            {nativeAd.advertiser ? (
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: typography.families.body,
                    fontSize: typography.scale.caption,
                    color: colors.textSecondary,
                    flex: 1,
                  }}
                >
                  {nativeAd.advertiser}
                </Text>
              </NativeAsset>
            ) : nativeAd.store ? (
              <NativeAsset assetType={NativeAssetType.STORE}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: typography.families.body,
                    fontSize: typography.scale.caption,
                    color: colors.textSecondary,
                    flex: 1,
                  }}
                >
                  {nativeAd.store}
                </Text>
              </NativeAsset>
            ) : (
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: typography.families.body,
                  fontSize: typography.scale.caption,
                  color: colors.textSecondary,
                  flex: 1,
                }}
              >
                Promoted
              </Text>
            )}
          </View>

          {/* CTA button — direct Text child for NativeAsset */}
          {nativeAd.callToAction ? (
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <Text
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: radius.pill,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  fontFamily: typography.families.bodyBold,
                  fontSize: typography.scale.caption,
                  color: '#fff',
                  overflow: 'hidden',
                  textAlign: 'center',
                }}
              >
                {nativeAd.callToAction}
              </Text>
            </NativeAsset>
          ) : null}
        </View>
      </View>
    </NativeAdView>
  );
}

export const NativeAdCard = memo(NativeAdCardInner);
