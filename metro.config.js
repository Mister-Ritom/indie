const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('db');
config.resolver.sourceExts.push('mjs');

// ─── Block canvaskit-wasm from native bundles ────────────────────────────────
// canvaskit-wasm contains Node.js `fs` / `path` imports that crash the
// React Native JS runtime. It is web-only (CanvasKit WASM), so we resolve
// it to an empty module for iOS and Android. The .web.ts platform extension
// already prevents our own code from importing it on native, but this guard
// handles any transitive path that might slip through.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform !== 'web' &&
    (moduleName === 'canvaskit-wasm' ||
      moduleName.startsWith('canvaskit-wasm/') ||
      // The full canvaskit bundle is also pulled via this path:
      moduleName.endsWith('canvaskit.js'))
  ) {
    return { type: 'empty' };
  }
  // Delegate to the original resolver (if one was set) or to Metro's default.
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
