import React from "react";
import {
  View,
  Image,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";

const LogoCard = ({ width = 200, height = 200 }) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const cardBg = isDark ? "#0F1729" : "#FFFFFF";
  const glowColor = isDark ? "rgba(124,58,237,0.18)" : "rgba(148,163,184,0.12)";

  return (
    <View style={styles.wrapper}>
      {/* Glow ring — web-safe, sits behind everything */}
      <View
        style={[
          styles.glow,
          {
            width: width + 40,
            height: height + 40,
            borderRadius: 36,
            backgroundColor: glowColor,
          },
        ]}
      />

      {/* The actual card surface */}
      <View
        style={[
          styles.card,
          {
            width,
            height,
            backgroundColor: cardBg,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            // iOS shadow
            shadowColor: isDark ? "#000" : "#64748b",
          },
        ]}
      >
        {/* Shine edge — top-left highlight */}
        <View
          style={[
            styles.shine,
            {
              borderTopColor: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.9)",
              borderLeftColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.6)",
            },
          ]}
        />

        <Image
          source={require("@assets/indie_rem.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    // Web & Android: fake glow with a blurred background tint
    ...Platform.select({
      web: {
        filter: "blur(16px)",
      },
      ios: {},
      android: {},
    }),
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    // iOS shadow
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
      },
    }),
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    borderRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  image: {
    width: "85%",
    height: "85%",
  },
});

export default LogoCard;
