import { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { Tabs, router, usePathname } from "expo-router";
import { Home, Search, PlusCircle, Bell, User } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { WebSidebar } from "@/components/layout/WebSidebar";
import { useNotifications } from "@/hooks/useNotifications";
import { useSidebarStore } from "@/stores/sidebarStore";
import { CreateMenuModal } from "@/components/CreateMenuModal";

export default function TabLayout() {
  const { colors } = useTheme();
  const { showSidebar } = useBreakpoint();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const { activePanel, closePanel } = useSidebarStore();
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);

  // Close active side panel when the route/pathname changes, unless it is the search panel on search page
  useEffect(() => {
    const isSearchRoute =
      pathname === "/search" || pathname === "/(tabs)/search";
    if (activePanel === "search" && isSearchRoute) {
      return;
    }
    closePanel();
  }, [pathname]);

  useEffect(() => {
    if (!showSidebar) {
      const style = document.createElement("style");
      style.textContent = `
        div[role="tablist"] {
          width: 100% !important;
          display: flex !important;
        }
        div[role="tablist"] > * {
          flex: 1 !important;
          justify-content: center !important;
          align-items: center !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (showSidebar) {
    return (
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <WebSidebar />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            position: "relative",
          }}
        >
          {/* Backdrop overlay to close the sidebar panel when clicking outside */}
          {activePanel && (
            <Pressable
              onPress={closePanel}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.02)",
                zIndex: 99999,
              }}
            />
          )}

          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: "none" },
            }}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="search" />
            <Tabs.Screen
              name="create"
              listeners={{
                tabPress: (e) => {
                  e.preventDefault();
                  setCreateModalVisible(true);
                },
              }}
            />
            <Tabs.Screen name="notifications" />
            <Tabs.Screen name="profile" />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            elevation: 0,
            height: 60,
            width: "100%",
          },
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarItemStyle: { flex: 1, minWidth: 0 },
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
              <Search size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
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
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setCreateModalVisible(true);
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
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
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
      <CreateMenuModal
        visible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </View>
  );
}
