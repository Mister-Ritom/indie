import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase/client";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

const MAX_DIMENSION = 2048;
const COMPRESS_QUALITY = 0.85;

/** Request camera + media library permissions */
export async function requestMediaPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const { status: camStatus } =
    await ImagePicker.requestCameraPermissionsAsync();
  const { status: libStatus } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  return camStatus === "granted" && libStatus === "granted";
}

/** Launch image picker (gallery) */
export async function pickImageFromGallery(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

/** Launch camera */
export async function takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 1,
  });
  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

/** Compress + resize image before upload.
 *  - If the image's longest edge is already ≤ MAX_DIMENSION it is only
 *    re-encoded (quality/format), never upscaled.
 *  - The correct axis (width vs height) is capped so portrait images
 *    don't get width-capped and accidentally enlarged.
 *  - GIFs are left completely untouched to preserve animation.
 */
export async function compressImage(
  uri: string,
  isGif = false,
  actualWidth = 0,
  actualHeight = 0,
): Promise<{ uri: string; width: number; height: number }> {
  if (isGif) {
    return { uri, width: 0, height: 0 };
  }

  // If the caller didn't supply dimensions, read them with a no-op pass.
  // This matters because without real dimensions we'd always fall into the
  // landscape (width-cap) branch, turning a 1080×2400 portrait into 2048×4551.
  let w = actualWidth;
  let h = actualHeight;
  if (w === 0 || h === 0) {
    const probe = await ImageManipulator.manipulateAsync(uri, [], {});
    w = probe.width;
    h = probe.height;
  }

  const actions: ImageManipulator.Action[] = [];
  const longest = Math.max(w, h);
  if (longest > MAX_DIMENSION) {
    // Cap only the longest edge so the image is never enlarged
    const resize: { width?: number; height?: number } =
      h > w
        ? { height: MAX_DIMENSION } // portrait
        : { width: MAX_DIMENSION };  // landscape / square
    actions.push({ resize });
  }
  // If image already fits within MAX_DIMENSION, actions is empty —
  // manipulateAsync will just re-encode at the requested quality.

  const result = await ImageManipulator.manipulateAsync(
    uri,
    actions,
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: result.uri, width: result.width, height: result.height };
}

/** Upload a file to a Supabase Storage bucket */
export async function uploadToStorage(
  bucket: string,
  path: string,
  uri: string,
  contentType: string,
): Promise<string> {
  let body: ArrayBuffer | Blob;

  if (Platform.OS === "web") {
    // Web: native fetch/blob works fine and is memory-efficient
    const response = await fetch(uri);
    body = await response.blob();
  } else {
    // Native (iOS/Android): blob().arrayBuffer() is unreliable on Hermes,
    // so read as base64 and decode instead
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    body = decode(base64);
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
