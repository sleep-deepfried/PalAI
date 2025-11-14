'use client';

import { useEffect } from 'react';

export function FullscreenHandler() {
  useEffect(() => {
    // Check if running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    // Only attempt fullscreen on desktop browsers or installed PWAs
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isStandalone || !isMobile) {
      const requestFullscreen = async () => {
        const element = document.documentElement;
        
        try {
          // Try different browser implementations (desktop only)
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if ((element as any).webkitRequestFullscreen) {
            await (element as any).webkitRequestFullscreen();
          } else if ((element as any).mozRequestFullScreen) {
            await (element as any).mozRequestFullScreen();
          } else if ((element as any).msRequestFullscreen) {
            await (element as any).msRequestFullscreen();
          }
        } catch (error) {
          // Fullscreen request failed - needs user interaction
          const handleFirstInteraction = async () => {
            try {
              if (element.requestFullscreen) {
                await element.requestFullscreen();
              } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
              }
            } catch (err) {
              console.debug('Fullscreen request failed:', err);
            }
          };
          
          document.addEventListener('click', handleFirstInteraction, { once: true });
          document.addEventListener('touchstart', handleFirstInteraction, { once: true });
        }
      };

      const timeoutId = setTimeout(() => {
        requestFullscreen();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    // For mobile browsers, hide address bar on scroll
    if (isMobile && !isStandalone) {
      const hideAddressBar = () => {
        window.scrollTo(0, 1);
      };
      
      // Hide on load
      setTimeout(hideAddressBar, 100);
      
      // Hide on orientation change
      window.addEventListener('orientationchange', hideAddressBar);
      
      return () => {
        window.removeEventListener('orientationchange', hideAddressBar);
      };
    }
  }, []);

  return null;
}

