import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { editProfileSchema, type EditProfileForm } from '@/utils/validators';
import { requestMediaPermissions, pickImageFromGallery, compressImage, uploadToStorage } from '@/utils/imageUpload';

export default function EditProfileScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { user, profile, setProfile } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Pending image waiting to be cropped
  const [pendingImage, setPendingImage] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      username: profile?.username ?? '',
      full_name: profile?.full_name ?? '',
      bio: profile?.bio ?? '',
      website: profile?.website ?? '',
    },
  });

  const handlePickAvatar = async () => {
    if (!await requestMediaPermissions()) return;
    const asset = await pickImageFromGallery();
    if (!asset || !user) return;

    // Store the raw picked image and open the crop modal
    setPendingImage({ uri: asset.uri, width: asset.width, height: asset.height });
    setShowCropModal(true);
  };

  /** Called when user confirms crop — compress + upload the cropped result */
  const handleCropConfirm = async (croppedUri: string) => {
    if (!user) return;
    setShowCropModal(false);
    setPendingImage(null);
    setIsUploadingAvatar(true);
    try {
      const { uri } = await compressImage(croppedUri, false);
      const path = `${user.id}/${Date.now()}.jpg`;
      const publicUrl = await uploadToStorage('avatars', path, uri, 'image/jpeg');
      setAvatarUri(publicUrl);
    } catch (e: any) {
      alert('Failed to upload avatar.');
    }
    setIsUploadingAvatar(false);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setPendingImage(null);
  };

  const onSubmit = async (data: EditProfileForm) => {
    if (!user) return;
    setIsLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        username: data.username,
        full_name: data.full_name,
        bio: data.bio,
        website: data.website,
        avatar_url: avatarUri,
      })
      .eq('id', user.id);
      
    if (error) {
      // Check for Postgres unique constraint violation on the username column
      if (error.code === '23505' && error.message.includes('profiles_username_key')) {
        alert('This username is already taken. Please choose another one.');
      } else {
        alert(error.message);
      }
    } else {
      setProfile(profile ? { ...profile, ...data, avatar_url: avatarUri } : null);
      router.canGoBack() ? router.back() : router.replace('/');
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.families.headingMedium, fontSize: typography.scale.h3, color: colors.text }}>
          Edit Profile
        </Text>
        <Button label="Save" size="sm" onPress={handleSubmit(onSubmit)} isLoading={isLoading} disabled={isUploadingAvatar} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }}>
          
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <View style={{ position: 'relative' }}>
              {isUploadingAvatar ? (
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <Avatar uri={avatarUri} name={profile?.username} size="xl" />
              )}
              <TouchableOpacity
                onPress={handlePickAvatar}
                disabled={isUploadingAvatar}
                style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.surfaceElevated, padding: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border }}
              >
                <Camera size={16} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ gap: spacing.lg }}>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.full_name?.message} />
              )}
            />
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Username" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.username?.message} />
              )}
            />
            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="About" multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.bio?.message} />
              )}
            />
            <Controller
              control={control}
              name="website"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Website" keyboardType="url" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.website?.message} />
              )}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image crop modal — shown after picking a photo */}
      {pendingImage && (
        <ImageCropModal
          visible={showCropModal}
          imageUri={pendingImage.uri}
          imageWidth={pendingImage.width}
          imageHeight={pendingImage.height}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </SafeAreaView>
  );
}
