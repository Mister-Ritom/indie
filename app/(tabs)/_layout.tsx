import { useEffect, useRef, useState } from "react";
import { View, Platform, Dimensions, Pressable } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { router } from "expo-router";
import { useNotifications } from "@/hooks/useNotifications";
import * as Haptics from "expo-haptics";
import { CreateMenuModal } from "@/components/CreateMenuModal";

const TAB_COUNT = 5;
const CREATE_TAB_INDEX = 2;
export default function TabLayout() {
  const screenWidth = Dimensions.get("window").width;
  const tabWidth = screenWidth / TAB_COUNT;
  const isNavigating = useRef(false);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);

  const handleCreatePress = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCreateModalVisible(true);
    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  };

  const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 83 : 56;
  // removed prefetch for create-menu since it is now a modal component

  const { unreadCount } = useNotifications();

  // Native mobile: true native tabs
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="search">
          <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="create" disabled>
          <NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="notifications">
          <NativeTabs.Trigger.Label>Notifications</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="bell.fill" md="notifications" />
          {unreadCount > 0 && (
            <NativeTabs.Trigger.Badge>
              {unreadCount.toString()}
            </NativeTabs.Trigger.Badge>
          )}
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
        </NativeTabs.Trigger>
      </NativeTabs>
      {/* Transparent overlay exactly covering the Create tab button */}
      <Pressable
        onPress={handleCreatePress}
        style={{
          position: "absolute",
          bottom: Platform.select({ ios: 0, android: 32 }),
          left: tabWidth * CREATE_TAB_INDEX,
          width: Platform.select({
            ios: tabWidth - 16,
            android: tabWidth,
          }),
          height: Platform.select({
            ios: TAB_BAR_HEIGHT,
            android: TAB_BAR_HEIGHT + 8,
          }),
          // backgroundColor: "rgba(255,0,0,0.6)", // for debug
        }}
        accessibilityLabel="Create"
        accessibilityRole="button"
      />
      <CreateMenuModal 
        visible={isCreateModalVisible} 
        onClose={() => setCreateModalVisible(false)} 
      />
    </View>
  );
}
