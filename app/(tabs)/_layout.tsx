import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Home, Search, PlusCircle, Bell, User } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { WebSidebar } from "@/components/layout/WebSidebar";

export default function TabLayout() {
  const { colors } = useTheme();
  const { showSidebar } = useBreakpoint();

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {showSidebar && <WebSidebar />}

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Tabs
          screenOptions={{
            headerShown: false,

            // Hide bottom tab bar if showing sidebar
            tabBarStyle: showSidebar
              ? { display: "none" }
              : {
                  backgroundColor: colors.tabBar,
                  borderTopColor: colors.tabBarBorder,
                  elevation: 0,
                  height: 60,
                  justifyContent: "center",
                  alignItems: "center",
                },
            tabBarActiveTintColor: colors.tabBarActive,
            tabBarInactiveTintColor: colors.tabBarInactive,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, focused }) => (
                <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: "Search",
              tabBarIcon: ({ color, focused }) => (
                <Search
                  size={24}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="create"
            options={{
              title: "Create",
              tabBarIcon: ({ color, focused }) => (
                <PlusCircle
                  size={24}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              ),

              animation: "fade",
            }}
            listeners={{
              tabPress: (e) => {
                // Prevent the default tab navigation
                e.preventDefault();
                // Push the create menu as a root-level transparent modal
                // so the actual current tab content stays visible behind it
                const { router } = require("expo-router");
                router.push("/create-menu");
              },
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: "Notifications",
              tabBarIcon: ({ color, focused }) => (
                <Bell size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color, focused }) => (
                <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
