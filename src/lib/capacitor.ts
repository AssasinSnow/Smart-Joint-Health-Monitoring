import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Initializes native mobile features (Status Bar, Splash Screen)
 * safely when running inside Capacitor on Android or iOS.
 */
export async function initNativeMobile(isDarkMode: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Hide native splash screen once React has rendered
    await SplashScreen.hide();

    // Configure status bar color and icon brightness to match theme
    await StatusBar.setStyle({
      style: isDarkMode ? Style.Dark : Style.Light,
    });

    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: isDarkMode ? '#030712' : '#f8fafc',
      });
    }
  } catch (err) {
    console.warn('Native mobile initialization note:', err);
  }
}

/**
 * Updates native status bar when dark/light mode toggles.
 */
export async function updateNativeStatusBar(isDarkMode: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setStyle({
      style: isDarkMode ? Style.Dark : Style.Light,
    });

    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: isDarkMode ? '#030712' : '#f8fafc',
      });
    }
  } catch (err) {
    console.warn('Native status bar update note:', err);
  }
}
