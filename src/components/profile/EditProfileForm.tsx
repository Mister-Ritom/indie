import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Lock } from 'lucide-react-native';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { editProfileSchema, type EditProfileForm as EditProfileFormType } from '@/utils/validators';
import { requestMediaPermissions, pickImageFromGallery, compressImage, uploadToStorage } from '@/utils/imageUpload';

interface EditProfileFormProps {
  onSuccess?: () => void;
}

export function EditProfileForm({ onSuccess }: EditProfileFormProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const { user, profile, setProfile } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

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

  const { control, handleSubmit, formState: { errors } } = useForm<EditProfileFormType>({
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

    setPendingImage({ uri: asset.uri, width: asset.width, height: asset.height });
    setShowCropModal(true);
  };

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

  const onSubmit = async (data: EditProfileFormType) => {
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
      if (error.code === '23505' && error.message.includes('profiles_username_key')) {
        alert('This username is already taken. Please choose another one.');
      } else {
        alert(error.message);
      }
    } else {
      setProfile(profile ? { ...profile, ...data, avatar_url: avatarUri } : null);
      if (onSuccess) {
        onSuccess();
      } else {
        router.canGoBack() ? router.back() : router.replace('/');
      }
    }
    setIsLoading(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: isDesktop ? 'row' : 'column',
          gap: spacing.xxl,
          alignItems: 'center',
        }}
      >
        {/* Profile Picture Section */}
        <View style={{ alignItems: 'center', width: isDesktop ? 200 : '100%', flexShrink: 0 }}>
          <View style={{ position: 'relative' }}>
            {isUploadingAvatar ? (
              <View style={{ 
                width: isDesktop ? 120 : 100, 
                height: isDesktop ? 120 : 100, 
                borderRadius: isDesktop ? 60 : 50, 
                backgroundColor: colors.surface, 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : (
              <Avatar 
                uri={avatarUri} 
                name={profile?.username} 
                size={isDesktop ? "xxl" : "xl"} 
              />
            )}
            <TouchableOpacity
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                backgroundColor: colors.surfaceElevated,
                padding: isDesktop ? 10 : 8,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Camera size={isDesktop ? 20 : 16} color={colors.text} />
            </TouchableOpacity>
          </View>
          {isDesktop && (
            <Text style={{ 
              fontFamily: typography.families.body,
              fontSize: typography.scale.bodySmall,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: spacing.md,
            }}>
              Allowed formats: JPG, PNG, GIF.
              Max size: 5MB.
            </Text>
          )}
        </View>

        {/* Form Fields Section */}
        <View style={{ flex: 1, width: '100%', gap: spacing.lg }}>
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: spacing.lg }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="full_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input label="Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.full_name?.message} />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input label="Username" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.username?.message} />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="About" multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.bio?.message} />
            )}
          />

          <Controller
            control={control}
            name="website"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Website" keyboardType="url" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.website?.message} />
            )}
          />

          {/* Locked / Read-only Fields */}
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <Text style={{ 
              fontFamily: typography.families.headingMedium,
              fontSize: typography.scale.bodyLarge,
              color: colors.text,
            }}>
              Private Information
            </Text>
            
            <View style={{ gap: spacing.md }}>
              <View>
                <Input
                  label="Email Address"
                  value={user?.email || 'No email provided'}
                  editable={false}
                  rightIcon={<Lock size={16} color={colors.textSecondary} />}
                  style={{ color: colors.textSecondary }}
                  containerStyle={{ opacity: 0.7 }}
                />
              </View>
              
              {user?.phone ? (
                <View>
                  <Input
                    label="Phone Number"
                    value={user.phone}
                    editable={false}
                    rightIcon={<Lock size={16} color={colors.textSecondary} />}
                    style={{ color: colors.textSecondary }}
                    containerStyle={{ opacity: 0.7 }}
                  />
                </View>
              ) : null}
            </View>
          </View>
          
          <View style={{ marginTop: spacing.xl, alignItems: isDesktop ? 'flex-end' : 'stretch' }}>
            <Button 
              label="Save Changes" 
              onPress={handleSubmit(onSubmit)} 
              isLoading={isLoading} 
              disabled={isUploadingAvatar} 
              style={isDesktop ? { minWidth: 200 } : undefined}
            />
          </View>
        </View>
      </View>

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
    </View>
  );
}
