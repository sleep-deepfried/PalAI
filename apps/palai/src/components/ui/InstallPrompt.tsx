'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const shouldShow = !dismissed || (Date.now() - dismissedTime) > oneDayInMs;

    if (!standalone && shouldShow) {
      // For Android/Chrome - capture install prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handler);

      // For iOS - show instructions after a delay
      if (iOS) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-2xl p-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="bg-white/20 p-2 rounded-xl flex-shrink-0">
            <Download className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Install PalAI</h3>
            <p className="text-sm text-green-50 mb-3">
              Get quick access and work offline
            </p>

            {isIOS ? (
              <div className="bg-white/10 rounded-lg p-3 text-xs space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  How to install on iOS:
                </p>
                <ol className="space-y-1 ml-6 list-decimal text-green-50">
                  <li>Tap the Share button below</li>
                  <li>Scroll and tap &ldquo;Add to Home Screen&rdquo;</li>
                  <li>Tap &ldquo;Add&rdquo; to install</li>
                </ol>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-white text-green-700 py-2.5 px-4 rounded-lg font-bold hover:bg-green-50 active:scale-95 transition-all"
                >
                  Install Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors text-sm"
                >
                  Maybe Later
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

