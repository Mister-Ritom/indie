import { useEffect } from "react";
import { View, Platform, Dimensions, Pressable } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { router } from "expo-router";
import { useNotifications } from "@/hooks/useNotifications";
const TAB_COUNT = 5;
const CREATE_TAB_INDEX = 2;
export default function TabLayout() {
  const screenWidth = Dimensions.get("window").width;
  const tabWidth = screenWidth / TAB_COUNT;

  const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 83 : 56;
  useEffect(() => {
    router.prefetch("/create-menu");
  }, []);

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
          <NativeTabs.Trigger.Badge>
            {unreadCount.toString()}
          </NativeTabs.Trigger.Badge>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
        </NativeTabs.Trigger>
      </NativeTabs>
      {/* Transparent overlay exactly covering the Create tab button */}
      <Pressable
        onPress={() => router.push("/create-menu")}
        style={{
          position: "absolute",
          bottom: 0,
          left: tabWidth * CREATE_TAB_INDEX,
          width: tabWidth - 16, // substract 16, i don't know its just debug
          height: TAB_BAR_HEIGHT,
          // backgroundColor: "rgba(255,0,0,1)", // for debug
        }}
        accessibilityLabel="Create"
        accessibilityRole="button"
      />
    </View>
  );
}
