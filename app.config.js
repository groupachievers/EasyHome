const { expo: baseConfig } = require('./app.json');

const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  '';

const basePlugins = Array.isArray(baseConfig.plugins) ? baseConfig.plugins : [];
const hasReactNativeMapsPlugin = basePlugins.some(
  (plugin) =>
    plugin === 'react-native-maps' ||
    (Array.isArray(plugin) && plugin[0] === 'react-native-maps')
);

const plugins = [...basePlugins];

if (googleMapsApiKey && !hasReactNativeMapsPlugin) {
  plugins.push([
    'react-native-maps',
    {
      androidGoogleMapsApiKey: googleMapsApiKey,
    },
  ]);
}

module.exports = {
  expo: {
    ...baseConfig,
    newArchEnabled: true,
    plugins,
    extra: {
      ...baseConfig.extra,
      googleMapsApiKeyConfigured: Boolean(googleMapsApiKey),
    },
  },
};
