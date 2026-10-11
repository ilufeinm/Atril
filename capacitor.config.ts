import type { CapacitorConfig } from '@capacitor/cli';

// La app lleva la web adentro (carpeta dist); ya no depende de Base44.
const config: CapacitorConfig = {
  appId: 'com.scorebook.musicapp',
  appName: 'Atril',
  webDir: 'dist',
};

export default config;
