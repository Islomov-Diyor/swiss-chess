# One codebase → Web + Android (+ iOS)

This project is **cross-platform**. You write code once; it runs on web and Android (and iOS if you need it).

## Same code, different platforms

| What you run              | Command                    | Result                          |
|---------------------------|----------------------------|---------------------------------|
| **Web app** (browser)     | `npm run web`              | Opens in browser at localhost   |
| **Web build** (static)    | `npm run export:web`       | Output in `dist/` for hosting   |
| **Android** (device/emulator) | `npm run android`      | Runs in Expo Go or emulator     |
| **iOS** (simulator, Mac only) | `npm run ios`          | Runs in iOS simulator           |

## Development

- **Web:** `npm run web` then open the URL in a browser.
- **Android:** `npm start` then press `a`, or run `npm run android` (with emulator/device connected or Expo Go).

## Building for release

- **Web:** `npm run export:web` → use the `dist/` folder on any web host.
- **Android APK:** Use [EAS Build](https://docs.expo.dev/build/setup/) (Expo’s cloud build) to produce an installable APK from this same project.

You only maintain **one codebase**; these commands just target different platforms.
