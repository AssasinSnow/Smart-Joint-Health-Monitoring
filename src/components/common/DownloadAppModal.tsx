import React, { useState, useEffect } from 'react';
import { AppLogo } from './AppLogo';
import { X, Download, Smartphone, Laptop, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Listen for beforeinstallprompt event (PWA installation)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions for manual install
      alert(
        'To install directly on this device:\n\n' +
        '• On Android Chrome: Tap the 3 dots (⋮) > "Install app" or "Add to Home screen"\n' +
        '• On iPhone Safari: Tap Share (↑) > "Add to Home Screen"\n' +
        '• On PC/Laptop Chrome/Edge: Click the Install icon in the address bar'
      );
    }
  };

  const apkDownloadUrl = 'https://github.com/AssasinSnow/Smart-Joint-Health-Monitoring/actions';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Electric Lightning Banner */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-6 text-white border-b border-navy-800 relative">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <AppLogo className="w-14 h-14 sm:w-16 sm:h-16 shadow-lg shadow-copper-500/20" />
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full bg-copper-500/20 text-copper-300 border border-copper-500/30 mb-1">
                <ShieldCheck className="w-3 h-3" />
                Verified App &amp; APK
              </div>
              <h3 className="text-xl font-bold text-white">Smart Joint Monitor</h3>
              <p className="text-xs text-slate-400">
                Install on Android, iOS, or PC with custom electric lightning logo
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Card 1: Direct Android APK */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Android Native App (.APK)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standalone installer with custom lightning icon &amp; splash screen
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                v1.0.0
              </span>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-copper-600 dark:text-copper-400">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Shows electric line &amp; lightning logo on Android home screen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Full offline data logging + local ESP32 Wi-Fi / MQTT support</span>
              </div>
            </div>

            <a
              href={apkDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Android APK (from GitHub Actions)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Card 2: 1-Tap Direct Install (PWA / WebAPK) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-copper-500/10 text-copper-600 dark:text-copper-400 border border-copper-500/20">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Instant App Install (Android / iOS / PC)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Installs directly from your browser in 5 seconds (No APK file needed)
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleInstallPwa}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-copper-500 hover:bg-copper-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-copper-500/20"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isInstalled ? 'App Already Installed ✔' : 'Install App to Device'}</span>
            </button>
          </div>

          {/* Quick Instructions list */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 px-1">
            <div className="font-bold text-slate-700 dark:text-slate-300">Quick Installation Notes:</div>
            <div>• <strong>Android Phones:</strong> Tap "Install App" above or download the APK. In Android Settings, allow "Install from Unknown Sources" if prompted.</div>
            <div>• <strong>iPhones / iPads:</strong> Open in Safari, tap the Share icon [↑], and tap <strong>"Add to Home Screen"</strong>.</div>
            <div>• <strong>PC / Laptop:</strong> Click the Install icon in your browser URL bar for a standalone desktop window.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
