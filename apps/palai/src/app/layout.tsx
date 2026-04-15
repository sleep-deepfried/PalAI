import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { BottomNav } from '@/components/layout/BottomNav';
import { Providers } from '@/components/layout/Providers';
import { FullscreenHandler } from '@/components/ui/FullscreenHandler';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'PalAI - Rice Leaf Disease Classification',
  description: 'AI-powered rice leaf disease classification for Filipino farmers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PalAI',
  },
  themeColor: '#576238',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ivory">
        <Providers>
          <Toaster position="top-center" richColors />
          <FullscreenHandler />
          <InstallPrompt />
          <div className="min-h-screen pb-16">{children}</div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
