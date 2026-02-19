import { Platform } from 'react-native';

export type ShareOptions = {
  url?: string;
  type?: string;
  message?: string;
};

export async function openShare(options: ShareOptions): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share && options.url) {
      try {
        const res = await fetch(options.url);
        const blob = await res.blob();
        const file = new File([blob], 'chess-results.png', { type: 'image/png' });
        await navigator.share({
          title: 'Swiss Chess',
          text: options.message,
          files: [file],
        });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') throw e;
      }
    } else {
      window.alert(options.message ?? 'Share is available in the mobile app.');
    }
    return;
  }
  const Share = require('react-native-share').default;
  await Share.open(options);
}
