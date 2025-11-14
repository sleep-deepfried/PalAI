'use client';

import { useEffect } from 'react';

export function FullscreenHandler() {
  useEffect(() => {
    const requestFullscreen = async () => {
      const element = document.documentElement;
      
      try {
        // Try different browser implementations
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Safari
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          // Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          // IE/Edge
          await (element as any).msRequestFullscreen();
        }
      } catch (error) {
        // Fullscreen request failed (likely needs user interaction)
        // Set up a fallback to request on first user interaction
        const handleFirstInteraction = async () => {
          try {
            if (element.requestFullscreen) {
              await element.requestFullscreen();
            } else if ((element as any).webkitRequestFullscreen) {
              await (element as any).webkitRequestFullscreen();
            } else if ((element as any).mozRequestFullScreen) {
              await (element as any).mozRequestFullScreen();
            } else if ((element as any).msRequestFullscreen) {
              await (element as any).msRequestFullscreen();
            }
          } catch (err) {
            // Silently fail - user may have denied permission
            console.debug('Fullscreen request failed:', err);
          }
          
          // Remove listeners after first attempt
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
        };
        
        // Listen for first user interaction
        document.addEventListener('click', handleFirstInteraction, { once: true });
        document.addEventListener('touchstart', handleFirstInteraction, { once: true });
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      requestFullscreen();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}

