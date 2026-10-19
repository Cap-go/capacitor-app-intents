import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.capgo.appintents',
  appName: 'Capgo App Intents',
  webDir: 'dist',
  ios: {
    minVersion: '16.0',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
    CapgoAppIntents: {
      appGroupId: 'group.app.capgo.appintents',
      spotlightDomainIdentifier: 'app.capgo.appintents',
    },
  },
};

export default config;
