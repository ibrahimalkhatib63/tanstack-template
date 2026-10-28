import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // TODO: must match the Bundle ID registered in Apple Developer.
  appId: 'com.example.tanstackchat',
  appName: 'TanStack Chat',
  // Static build output (see `prerender` in app.config.ts).
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
}

export default config
