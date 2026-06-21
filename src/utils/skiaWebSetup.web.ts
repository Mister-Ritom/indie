/**
 * skiaWebSetup.web.ts
 *
 * Platform-specific file — ONLY bundled on web by Metro/Webpack.
 * Calls LoadSkiaWeb so that CanvasKit WASM is ready before any
 * <Canvas> is mounted in the browser.
 */
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' });
