import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart, MessageCircle, UserPlus } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotifications } from '@/hooks/useNotifications';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/utils/formatters';
import type { Notification } from '@/types/database';

export default function NotificationsScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { showSidebar } = useBreakpoint();
  const { notifications, isLoading, refresh, markAsRead } = useNotifications();

  const handlePress = (notif: Notification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.type === 'follow') {
      router.push(`/user/${notif.actor.username}`);
    } else if (notif.pin) {
      router.push(`/pin/${notif.pin.id}`);
    }
  };

  const renderItem = ({ item: notif }: { item: Notification }) => {
    let icon, text;
    if (notif.type === 'like') {
      icon = <Heart size={16} color={colors.primary} fill={colors.primary} />;
      text = <Text><Text style={{ fontFamily: typography.families.bodyBold }}>{notif.actor.username}</Text> liked your pin.</Text>;
    } else if (notif.type === 'comment') {
      icon = <MessageCircle size={16} color={colors.success} fill={colors.success} />;
      text = <Text><Text style={{ fontFamily: typography.families.bodyBold }}>{notif.actor.username}</Text> commented on your pin.</Text>;
    } else {
      icon = <UserPlus size={16} color={colors.warning} />;
      text = <Text><Text style={{ fontFamily: typography.families.bodyBold }}>{notif.actor.username}</Text> started following you.</Text>;
    }

    return (
      <TouchableOpacity
        onPress={() => handlePress(notif)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: notif.read ? colors.background : colors.surface,
        }}
      >
        <View style={{ position: 'relative' }}>
          <Avatar uri={notif.actor.avatar_url} name={notif.actor.username} size="md" />
          <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: colors.background, borderRadius: 10, padding: 2 }}>
            {icon}
          </View>
        </View>

        <View style={{ flex: 1, marginLeft: spacing.md, marginRight: spacing.md }}>
          <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.body, color: colors.text }}>
            {text}
          </Text>
          <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.caption, color: colors.textSecondary, marginTop: 2 }}>
            {timeAgo(notif.created_at)}
          </Text>
        </View>

        {notif.pin && (
          <View style={{ width: 48, height: 64, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: notif.pin.dominant_color ?? colors.skeleton }}>
            {notif.pin.thumb_url && <Image source={{ uri: notif.pin.thumb_url }} style={{ flex: 1 }} resizeMode="cover" />}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={showSidebar ? ['top', 'bottom'] : ['top']}>
      <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontFamily: typography.families.headingBold, fontSize: typography.scale.h2, color: colors.text }}>
          Notifications
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={refresh}
          ListEmptyComponent={
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.families.body, fontSize: typography.scale.bodyLarge, color: colors.textSecondary }}>
                No notifications yet.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
