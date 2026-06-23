module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@": "./src",
            "@theme": "./src/theme/theme",
            "@components": "./src/components",
            "@hooks": "./src/hooks",
            "@stores": "./src/stores",
            "@lib": "./src/lib",
            "@types": "./src/types",
            "@utils": "./src/utils",
            "@assets": "./assets",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
