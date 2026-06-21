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

/** Compress + resize image before upload */
export async function compressImage(
  uri: string,
  isGif = false,
): Promise<{ uri: string; width: number; height: number }> {
  if (isGif) {
    // Skip manipulation for GIFs — preserve animation
    return { uri, width: 0, height: 0 };
  }
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
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
