import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.waiterai.ally',
  appName: 'Ally by WAITER',
  webDir: 'dist',
  ios: {
    // Enable swipe-back gesture navigation
    allowsLinkPreview: true,
    scrollEnabled: true,
  },
  plugins: {
    App: {
      // Enable native back gesture
    }
  }
};

export default config;
