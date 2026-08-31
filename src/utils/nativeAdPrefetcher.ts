import { Platform } from 'react-native';
import { AD_UNITS } from '@/utils/constants';

let NativeAdClass: any = null;
let TestIds: any = null;

try {
  const m = require('react-native-google-mobile-ads');
  NativeAdClass = m.NativeAd;
  TestIds = m.TestIds;
} catch {
  // Web / Expo Go
}

async function requestAd(): Promise<any> {
  if (!NativeAdClass) return null;

  if (__DEV__ && TestIds) {
    try {
      // Attempt video test ad first
      return await NativeAdClass.createForAdRequest(TestIds.NATIVE_VIDEO, {
        startVideoMuted: true,
      });
    } catch {
      // If video test ad has no fill or times out, fall back to standard test ad
      return await NativeAdClass.createForAdRequest(TestIds.NATIVE);
    }
  }

  const adUnitId =
    Platform.OS === 'ios'
      ? AD_UNITS.ios.homeNative
      : AD_UNITS.android.homeNative;

  return await NativeAdClass.createForAdRequest(adUnitId, {
    startVideoMuted: true,
  });
}

class NativeAdPrefetchManager {
  private pool: any[] = [];
  private isFetching = false;

  /**
   * Prefetches 1 ad into the pool in the background if empty
   */
  async prefetch(): Promise<void> {
    if (!NativeAdClass || this.isFetching || this.pool.length >= 1) {
      return;
    }

    this.isFetching = true;
    try {
      const ad = await requestAd();
      if (ad) {
        this.pool.push(ad);
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[AdMob Prefetch Error]:', err);
      }
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Retrieves a prefetched ad if available, or loads on demand.
   * Also triggers background prefetch for the next upcoming slot.
   */
  async getAd(): Promise<any> {
    if (!NativeAdClass) return null;

    let ad = this.pool.shift();
    // Replenish the pool in the background
    this.prefetch();

    if (ad) {
      return ad;
    }

    // Load on demand if pool was empty
    return await requestAd();
  }

  /**
   * Destroys all unclaimed prefetched ads to prevent memory leaks
   */
  clearPool(): void {
    while (this.pool.length > 0) {
      const ad = this.pool.shift();
      try {
        ad?.destroy();
      } catch {
        // ignore
      }
    }
  }
}

export const nativeAdPrefetcher = new NativeAdPrefetchManager();
