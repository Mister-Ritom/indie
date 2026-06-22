import { Platform } from "react-native";

export function initSkiaWeb() {
  if (Platform.OS !== "web") return;

  const { LoadSkiaWeb } = require("@shopify/react-native-skia/lib/module/web");

  LoadSkiaWeb({
    locateFile: (file: string) => `/${file}`,
  });
}
