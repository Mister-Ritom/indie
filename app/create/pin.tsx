import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image, // Used both as a component and for Image.getSize
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ImagePlus,
  X,
  ChevronDown,
  Pencil,
  ArrowLeft,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { createPinSchema, type CreatePinForm } from "@/utils/validators";
import {
  requestMediaPermissions,
  pickImageFromGallery,
  takePhoto,
  compressImage,
  uploadToStorage,
} from "@/utils/imageUpload";
import { useEditorStore } from "@/stores/editorStore";
import type { Interest, Board } from "@/types/database";

export default function CreatePinScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { showSidebar } = useBreakpoint();
  const { user } = useAuthStore();
  const { width: screenWidth } = useWindowDimensions();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);

  const {
    setOriginalImage,
    editedUri,
    clear: clearEditorStore,
  } = useEditorStore();

  // Handle image passing back from image editor
  useEffect(() => {
    if (editedUri) {
      setImageUri(editedUri);
      clearEditorStore();
    }
  }, [editedUri, clearEditorStore]);

  // FIX: Dynamic aspect ratio engine for Web & Native
  // Automatically calculates true dimensions whenever the image source updates
  useEffect(() => {
    if (imageUri) {
      Image.getSize(
        imageUri,
        (width, height) => {
          setImageWidth(width);
          setImageHeight(height);
        },
        (error) => {
          console.warn(
            "Could not determine image dimensions automatically:",
            error,
          );
        },
      );
    }
  }, [imageUri]);

  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [showBoardPicker, setShowBoardPicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePinForm>({
    resolver: zodResolver(createPinSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
      alt_text: "",
      interest_id: "",
      board_id: "",
    },
  });

  const selectedInterestId = watch("interest_id");
  const selectedBoardId = watch("board_id");

  useEffect(() => {
    supabase
      .from("interests")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setInterests(data);
      });
    if (user) {
      supabase
        .from("boards")
        .select("*")
        .eq("user_id", user.id)
        .order("name")
        .then(({ data }) => {
          if (data) setBoards(data);
        });
    }
  }, [user]);

  const handlePickImage = async () => {
    const hasPerm = await requestMediaPermissions();
    if (!hasPerm) {
      alert("Camera roll permissions are required.");
      return;
    }
    const asset = await pickImageFromGallery();
    if (asset) {
      const isGif = asset.uri.toLowerCase().endsWith(".gif");
      const { uri } = await compressImage(
        asset.uri,
        isGif,
        asset.width ?? 0,
        asset.height ?? 0,
      );
      setImageUri(uri);
    }
  };

  const handleTakePhoto = async () => {
    const hasPerm = await requestMediaPermissions();
    if (!hasPerm) {
      alert("Camera permissions are required.");
      return;
    }
    const asset = await takePhoto();
    if (asset) {
      const isGif = asset.uri.toLowerCase().endsWith(".gif");
      const { uri } = await compressImage(
        asset.uri,
        isGif,
        asset.width ?? 0,
        asset.height ?? 0,
      );
      setImageUri(uri);
    }
  };

  const onSubmit = async (data: CreatePinForm) => {
    if (!imageUri || !user) return;
    setIsUploading(true);

    try {
      const isGif = imageUri.toLowerCase().endsWith(".gif");
      const pinId = Crypto.randomUUID();
      const path = `${user.id}/${pinId}`;
      await uploadToStorage(
        "pin-originals",
        path,
        imageUri,
        isGif ? "image/gif" : "image/jpeg",
      );

      const { data: pinData, error: pinError } = await supabase
        .from("pins")
        .insert({
          id: pinId,
          user_id: user.id,
          board_id: data.board_id || null,
          interest_id: data.interest_id,
          title: data.title,
          description: data.description,
          link: data.link,
          alt_text: data.alt_text,
          media_type: isGif ? "gif" : "image",
          width: imageWidth > 0 ? imageWidth : null,
          height: imageHeight > 0 ? imageHeight : null,
        })
        .select()
        .single();

      if (pinError) throw pinError;

      router.canGoBack() ? router.back() : router.replace('/');
      setTimeout(() => {
        router.push(`/pin/${pinData.id}`);
      }, 150);
    } catch (e: any) {
      alert(e.message || "Failed to upload pin");
    } finally {
      setIsUploading(false);
    }
  };

  const isWebDesktop = Platform.OS === "web" && showSidebar;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={showSidebar ? ["top", "bottom"] : ["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header with back button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: typography.families.headingBold,
              fontSize: typography.scale.h3,
              color: colors.text,
              marginLeft: spacing.md,
            }}
          >
            Create Pin
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <View
            style={{
              flexDirection: isWebDesktop ? "row" : "column",
              gap: spacing.xl,
              alignItems: isWebDesktop ? "flex-start" : "stretch",
            }}
          >
            {/* Image Picker */}
            {(() => {
              // FIX: Prevent full-screen width expansion when side-by-side on Web
              const containerWidth = isWebDesktop
                ? 420
                : screenWidth - spacing.xl * 2;

              const aspect =
                imageWidth > 0 && imageHeight > 0
                  ? imageWidth / imageHeight
                  : 4 / 5;

              // Cap heights reasonably so ultra-tall images don't stretch indefinitely
              const containerHeight = Math.min(containerWidth / aspect, 600);

              return (
                <View style={{ width: containerWidth }}>
                  {imageUri ? (
                    <View
                      style={{
                        width: containerWidth,
                        height: containerHeight,
                      }}
                      collapsable={false}
                      renderToHardwareTextureAndroid
                    >
                      {/* Image clip wrapper */}
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: containerWidth,
                          height: containerHeight,
                          borderRadius: radius.lg,
                          overflow: "hidden",
                          backgroundColor: colors.surface,
                        }}
                      >
                        <Image
                          source={{ uri: imageUri }}
                          style={{
                            width: containerWidth,
                            height: containerHeight,
                          }}
                          resizeMode="cover"
                        />
                      </View>
                      {/* Buttons */}
                      <TouchableOpacity
                        onPress={() => {
                          setImageUri(null);
                          setImageWidth(0);
                          setImageHeight(0);
                        }}
                        style={{
                          position: "absolute",
                          top: spacing.md,
                          right: spacing.md,
                          backgroundColor: colors.overlay,
                          padding: 8,
                          borderRadius: radius.pill,
                          zIndex: 10,
                        }}
                      >
                        <X size={20} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setOriginalImage(imageUri, imageWidth, imageHeight);
                          router.push("/photo-editor");
                        }}
                        style={{
                          position: "absolute",
                          top: spacing.md,
                          right: spacing.md + 48,
                          backgroundColor: "rgba(28,28,28,0.85)",
                          padding: 8,
                          borderRadius: radius.pill,
                          zIndex: 10,
                        }}
                      >
                        <Pencil size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      style={{
                        width: containerWidth,
                        height: 300,
                        borderRadius: radius.lg,
                        borderWidth: 2,
                        borderColor: colors.border,
                        borderStyle: "dashed",
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        padding: spacing.xl,
                        gap: spacing.md,
                      }}
                    >
                      <ImagePlus size={48} color={colors.iconMuted} />
                      <Text
                        style={{
                          fontFamily: typography.families.bodyMedium,
                          fontSize: typography.scale.bodyLarge,
                          color: colors.textSecondary,
                        }}
                      >
                        Choose a file
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: spacing.md,
                          marginTop: spacing.md,
                        }}
                      >
                        <Button
                          label="Gallery"
                          variant="secondary"
                          onPress={handlePickImage}
                        />
                        <Button
                          label="Camera"
                          variant="secondary"
                          onPress={handleTakePhoto}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* Form */}
            <View style={{ flex: 1, gap: spacing.md }}>
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Title"
                    placeholder="Add a title"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.title?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Description"
                    placeholder="Add a detailed description"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.description?.message}
                    multiline
                    numberOfLines={3}
                    style={{ height: 80, textAlignVertical: "top" }}
                  />
                )}
              />

              <Controller
                control={control}
                name="link"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Destination link"
                    placeholder="https://"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.link?.message}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                )}
              />

              {/* Interest Picker */}
              <View>
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.bodySmall,
                    color: colors.text,
                    marginBottom: 6,
                  }}
                >
                  Category (Required)
                </Text>
                <TouchableOpacity
                  onPress={() => setShowInterestPicker(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    backgroundColor: colors.inputBg,
                    borderRadius: radius.lg,
                    borderWidth: 1.5,
                    borderColor: errors.interest_id
                      ? colors.error
                      : colors.inputBorder,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.families.body,
                      fontSize: typography.scale.body,
                      color: selectedInterestId
                        ? colors.text
                        : colors.textTertiary,
                    }}
                  >
                    {selectedInterestId
                      ? interests.find((i) => i.id === selectedInterestId)?.name
                      : "Select a category"}
                  </Text>
                  <ChevronDown size={20} color={colors.iconMuted} />
                </TouchableOpacity>
                {errors.interest_id && (
                  <Text
                    style={{
                      fontFamily: typography.families.body,
                      fontSize: typography.scale.caption,
                      color: colors.error,
                      marginTop: 4,
                    }}
                  >
                    {errors.interest_id.message}
                  </Text>
                )}
              </View>

              {/* Board Picker */}
              <View>
                <Text
                  style={{
                    fontFamily: typography.families.bodyMedium,
                    fontSize: typography.scale.bodySmall,
                    color: colors.text,
                    marginBottom: 6,
                  }}
                >
                  Board (Optional)
                </Text>
                <TouchableOpacity
                  onPress={() => setShowBoardPicker(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    backgroundColor: colors.inputBg,
                    borderRadius: radius.lg,
                    borderWidth: 1.5,
                    borderColor: colors.inputBorder,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.families.body,
                      fontSize: typography.scale.body,
                      color: selectedBoardId
                        ? colors.text
                        : colors.textTertiary,
                    }}
                  >
                    {selectedBoardId
                      ? boards.find((b) => b.id === selectedBoardId)?.name
                      : "Choose a board"}
                  </Text>
                  <ChevronDown size={20} color={colors.iconMuted} />
                </TouchableOpacity>
              </View>

              <Button
                label="Publish"
                onPress={handleSubmit(onSubmit)}
                disabled={!imageUri || isUploading}
                isLoading={isUploading}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.lg }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Interest Picker Modal */}
      <Modal
        visible={showInterestPicker}
        onClose={() => setShowInterestPicker(false)}
        title="Select Category"
      >
        {interests.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            onPress={() => {
              setValue("interest_id", interest.id, { shouldValidate: true });
              setShowInterestPicker(false);
            }}
            style={{
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: typography.families.bodyMedium,
                fontSize: typography.scale.body,
                color: colors.text,
              }}
            >
              {interest.name}
            </Text>
          </TouchableOpacity>
        ))}
      </Modal>

      {/* Board Picker Modal */}
      <Modal
        visible={showBoardPicker}
        onClose={() => setShowBoardPicker(false)}
        title="Select Board"
      >
        <TouchableOpacity
          onPress={() => {
            setValue("board_id", "");
            setShowBoardPicker(false);
          }}
          style={{
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: typography.families.bodyMedium,
              fontSize: typography.scale.body,
              color: colors.text,
            }}
          >
            No board (Profile only)
          </Text>
        </TouchableOpacity>
        {boards.map((board) => (
          <TouchableOpacity
            key={board.id}
            onPress={() => {
              setValue("board_id", board.id);
              setShowBoardPicker(false);
            }}
            style={{
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: typography.families.bodyMedium,
                fontSize: typography.scale.body,
                color: colors.text,
              }}
            >
              {board.name}
            </Text>
          </TouchableOpacity>
        ))}
      </Modal>
    </SafeAreaView>
  );
}
