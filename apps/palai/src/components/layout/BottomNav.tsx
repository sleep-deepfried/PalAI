'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, History, Home, BarChart3 } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/scan', label: 'Scan', icon: Camera },
    { href: '/history', label: 'History', icon: History },
    { href: '/stats', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ivory/95 backdrop-blur-md border-t border-olive-200 safe-area-bottom z-50 shadow-lg">
      <div className="grid grid-cols-4 h-16">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              data-tour={link.label === 'Scan' ? 'nav-scan' : undefined}
              className={`flex flex-col items-center justify-center gap-1 transition-all relative ${
                isActive ? 'text-olive' : 'text-olive-400 hover:text-olive active:scale-95'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-olive rounded-full" />
              )}

              <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-xs transition-all ${isActive ? 'font-bold' : 'font-medium'}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
