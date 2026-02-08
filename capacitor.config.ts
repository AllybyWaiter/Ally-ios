import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.waiterai.ally',
  appName: 'Ally by WAITER',
  webDir: 'dist',
  // Uncomment for local development with native app:
  // server: {
  //   url: 'http://192.168.1.X:8080',
  //   cleartext: true,
  // },
  ios: {
    allowsLinkPreview: true,
    scrollEnabled: true,
  },
  plugins: {
    App: {
      // Enable native back gesture
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'dark',
    },
  }
};

export default config;
