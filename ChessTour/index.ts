// Polyfill for React Native: uuid needs crypto.getRandomValues (not available on RN)
import 'react-native-get-random-values';

// Web: ensure root has height before React mounts (fixes blank screen)
if (typeof document !== 'undefined') {
  const id = 'expo-web-root-reset';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = 'html,body{height:100%;margin:0;}body{overflow:hidden}#root{display:flex;height:100%;flex:1;min-height:100vh;}';
    document.head.appendChild(style);
  }
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
