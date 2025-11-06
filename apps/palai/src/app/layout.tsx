import type { Metadata, Viewport } from 'next';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'PalAI - Rice Leaf Disease Classification',
  description: 'AI-powered rice leaf disease classification for Filipino farmers',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="min-h-screen pb-16">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}

