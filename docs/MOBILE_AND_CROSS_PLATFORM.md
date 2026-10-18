# Smart Joint Monitor — Cross-Platform Deployment Guide

This guide details how **Smart Joint Monitor** runs across all target environments:
1. **Android Smartphone / Tablet** (Native APK / Google Play ready via Capacitor)
2. **iOS iPhone / iPad** (Native Xcode / IPA / App Store ready via Capacitor)
3. **Laptop & PC** (Desktop PWA via Chrome / Edge, or any modern web browser)

---

## 1. Architectural Overview

```
                          ┌─────────────────────────────┐
                          │   Vite + React 18 + TS      │
                          │   Tailwind CSS + Recharts   │
                          │   Zustand + Dexie.js (IDB)  │
                          └──────────────┬──────────────┘
                                         │ npm run build
                                         ▼
                          ┌─────────────────────────────┐
                          │   Optimized Dist Assets     │
                          │   (PWA Manifest + SW)       │
                          └──────┬───────────────┬──────┘
                                 │               │
            ┌────────────────────┼───────────────┼────────────────────┐
            ▼                    ▼               ▼                    ▼
     ┌──────────────┐     ┌──────────────┐ ┌──────────────┐    ┌──────────────┐
     │ Laptop / PC  │     │ Mobile Web   │ │ Native       │    │ Native iOS   │
     │ Desktop PWA  │     │ PWA          │ │ Android App  │    │ App (Xcode)  │
     │ (Edge/Chrome)│     │ (Safari/     │ │ (Capacitor / │    │ (Capacitor / │
     │              │     │  Chrome)     │ │  Gradle APK) │    │  Swift / IPA)│
     └──────────────┘     └──────────────┘ └──────────────┘    └──────────────┘
```

The unified codebase requires **zero code duplication**. The UI automatically adapts:
- **On Phones:** Thumb-friendly bottom navigation, full touch gestures, 44px+ hit areas, and 16px input font scaling to prevent auto-zooming.
- **On Laptops / PCs:** Multi-column dashboard, left-hand sidebar navigation, tabular data views, and `@media print` laboratory reports.

---

## 2. Running on Laptop & PC (Windows, macOS, Linux)

### Method A: Standalone Desktop PWA (Recommended)
You can install Smart Joint Monitor directly onto your desktop OS without needing Electron or third-party wrappers:
1. Start the server:
   ```bash
   npm run preview
   # or
   npm run dev
   ```
2. Open **Google Chrome** or **Microsoft Edge** to `http://localhost:5173`.
3. In the browser address bar, click the **Install App** icon (or click the three dots `⋮` > **"Install Smart Joint Monitor"**).
4. **Result:** The app launches in its own dedicated, chromeless window, adds a desktop shortcut, and integrates into the Windows Start Menu, macOS Dock, or Linux application launcher with full offline capabilities!

### Method B: In Any Web Browser
Simply navigate to `http://localhost:5173` in Chrome, Firefox, Safari, Edge, or Brave.

---

## 3. Building & Running on Android (Phones & Tablets)

The native Android project is located at:
`C:\Users\aswaj\.gemini\antigravity\scratch\smart-joint-monitor\android`

### Prerequisites
- [Android Studio](https://developer.android.com/studio) (includes Android SDK and bundled Java/JDK).
- An Android device (Android 7.0 / API 24 or newer) or Android Emulator.

### Step-by-Step Instructions

#### 1. Rebuild and Sync Latest Code
Whenever you make changes to the React code, run:
```bash
npm run cap:sync
```
This builds the production web assets and syncs them into `android/app/src/main/assets/public`.

#### 2. Open in Android Studio
Launch Android Studio with the project preloaded:
```bash
npm run cap:android
```
*(Alternatively, open Android Studio manually, choose **Open**, and select the `android` folder).*

#### 3. Run on a Physical Android Phone
1. On your phone, enable **Developer Options** (tap *Build Number* 7 times in Settings > About Phone).
2. Enable **USB Debugging** in Developer Options.
3. Connect your phone to your PC via USB cable.
4. In Android Studio, select your phone in the top device dropdown and click the green **Run (▶)** button.
5. The app will install and open immediately on your phone!

#### 4. Generate a Standalone `.apk` (Direct Installation File)
In Android Studio:
1. Click **Build** in the top menu.
2. Select **Build Bundle(s) / APK(s) > Build APK(s)**.
3. Once the build completes, a popup in the bottom right will say **"APK(s) generated successfully"**. Click **locate**.
4. The file will be at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
5. You can copy this `.apk` to any Android phone via WhatsApp, Google Drive, or USB and tap to install!

### Hardware & Network Configuration for Android
- **Local ESP32 Access:** In `android/app/src/main/AndroidManifest.xml`, `android:usesCleartextTraffic="true"` is enabled. This allows the Android app to connect to local IP addresses (e.g. `http://192.168.4.1/data` or `ws://192.168.1.50:9001`) without HTTPS restrictions.
- **Permissions:** `INTERNET`, `ACCESS_NETWORK_STATE`, and `ACCESS_WIFI_STATE` are pre-configured.

---

## 4. Building & Running on iOS (iPhone & iPad)

The native iOS Xcode project is located at:
`C:\Users\aswaj\.gemini\antigravity\scratch\smart-joint-monitor\ios`

### Prerequisites
- A Mac computer running macOS.
- [Xcode](https://developer.apple.com/xcode/) installed from the Mac App Store.
- An Apple ID (a free personal Apple ID is sufficient for testing on physical iPhones).

### Step-by-Step Instructions

#### 1. Rebuild and Sync
```bash
npm run cap:sync
```

#### 2. Open in Xcode
On your Mac:
```bash
npm run cap:ios
```
*(Or open `ios/App/App.xcworkspace` in Xcode).*

#### 3. Configure Signing
1. In Xcode's left sidebar, click on the **App** project.
2. Go to the **Signing & Capabilities** tab.
3. Check **Automatically manage signing**.
4. Select your **Team** (your personal Apple ID).

#### 4. Run on iPhone or Simulator
1. Connect your iPhone via USB, or select an iOS Simulator (e.g. *iPhone 15 Pro*).
2. Click the **Run (▶)** button or press `Cmd + R`.
3. If deploying to a physical device, go to **Settings > General > VPN & Device Management** on your iPhone to trust your developer certificate.

### iOS Security & Network Configuration
In `ios/App/App/Info.plist`, `NSAppTransportSecurity` is configured with `NSAllowsArbitraryLoads: true` so the app can communicate with local ESP32 microcontrollers over local Wi-Fi without blocking insecure HTTP/WS traffic.

---

## 5. Quick Reference Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start local Vite dev server with hot reload |
| `npm run dev -- --host` | Expose dev server to local Wi-Fi for mobile browser testing |
| `npm run build` | Compile TypeScript and bundle production assets |
| `npm run preview` | Serve production build locally with PWA support |
| `npm run cap:sync` | Build web app and sync native Android and iOS folders |
| `npm run cap:android` | Build, sync, and open project in Android Studio |
| `npm run cap:ios` | Build, sync, and open project in Xcode |
| `npm test` | Run all 19 automated unit tests |
