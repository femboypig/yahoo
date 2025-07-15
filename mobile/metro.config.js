const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default config
const config = getDefaultConfig(__dirname);

// Export the config with NativeWind
module.exports = withNativeWind(config, {
    input: './global.css',
}); 