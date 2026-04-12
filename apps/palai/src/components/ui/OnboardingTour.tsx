'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface TourStep {
  selector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom';
}

const tourSteps: TourStep[] = [
  {
    selector: '[data-tour="scan-cta"]',
    title: 'Scan a Rice Leaf 📸',
    description:
      'Tap here to take a photo or upload an image of a rice leaf for instant AI analysis.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="history"]',
    title: 'View Your History 📋',
    description: 'All your past scans are saved here so you can track your crops over time.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="insights"]',
    title: 'Insights & Analytics 📊',
    description: 'See trends, disease distribution, and confidence stats across all your scans.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="nav-scan"]',
    title: 'Quick Scan Access 📱',
    description: 'You can also start a scan anytime from the bottom navigation bar.',
    position: 'top',
  },
];

export function OnboardingTour() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const hasSyncedJwtRef = useRef(false);

  const measureElement = useCallback(() => {
    const currentStep = tourSteps[step];
    if (!currentStep) return;
    const el = document.querySelector(currentStep.selector);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect(r);
    }
  }, [step]);

  const scrollAndMeasure = useCallback(() => {
    const currentStep = tourSteps[step];
    if (!currentStep) return;
    const el = document.querySelector(currentStep.selector);
    if (el) {
      // Always scroll to position element nicely with room for tooltip
      const offset = currentStep.position === 'bottom' ? 0.25 : 0.5;
      const targetY = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * offset;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      setTimeout(() => measureElement(), 400);
    }
  }, [step, measureElement]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantsTour = params.get('tour') === '1';
    if (wantsTour && !hasSyncedJwtRef.current) {
      hasSyncedJwtRef.current = true;
      void update();
    }
    if (!wantsTour) {
      return;
    }
    const timer = setTimeout(() => {
      setShow(true);
      scrollAndMeasure();
    }, 600);
    return () => clearTimeout(timer);
  }, [scrollAndMeasure, update]);

  useEffect(() => {
    if (!show) return;
    scrollAndMeasure();
  }, [show, step, scrollAndMeasure]);

  useEffect(() => {
    if (!show) return;
    const handler = () => measureElement();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [show, measureElement]);

  const dismissTour = () => {
    setShow(false);
    router.replace('/');
  };

  const handleNext = () => {
    setRect(null);
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      dismissTour();
    }
  };

  const handleSkip = () => dismissTour();

  if (!show || !rect) return null;

  const pad = 6;
  const currentStep = tourSteps[step];

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10002,
    width: '280px',
  };

  if (currentStep.position === 'bottom') {
    tooltipStyle.top = rect.bottom + pad + 8;
    tooltipStyle.left = Math.max(
      8,
      Math.min(rect.left + rect.width / 2 - 140, window.innerWidth - 288)
    );
  } else {
    tooltipStyle.bottom = window.innerHeight - rect.top + pad + 8;
    tooltipStyle.left = Math.max(
      8,
      Math.min(rect.left + rect.width / 2 - 140, window.innerWidth - 288)
    );
  }

  return (
    <>
      {/* Dark overlay with rectangular cutout */}
      <div
        className="fixed z-[10000] pointer-events-auto"
        onClick={handleSkip}
        style={{
          position: 'fixed',
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          borderRadius: '12px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
        }}
      />

      {/* Highlight ring */}
      <div
        className="fixed z-[10001] pointer-events-none rounded-xl"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          border: '2px solid rgba(34, 197, 94, 0.7)',
          boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)',
        }}
      />

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 text-sm">{currentStep.title}</h3>
          <span className="text-xs text-gray-400">
            {step + 1}/{tourSteps.length}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">{currentStep.description}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            {step === tourSteps.length - 1 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
