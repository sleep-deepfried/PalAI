'use client';

import { useState } from 'react';
import { completeOnboarding } from '@/app/actions/onboarding';

const steps = [
  {
    title: 'Welcome to PalAI 🌾',
    description:
      'PalAI helps Filipino farmers identify rice leaf diseases quickly and accurately using AI-powered image analysis.',
    icon: '👋',
  },
  {
    title: 'Scan a Rice Leaf 📸',
    description:
      'Take a photo of a rice leaf or upload an image. PalAI will analyze it and detect common diseases like rice blast, bacterial blight, and brown spot.',
    icon: '🔍',
  },
  {
    title: 'Get a Diagnosis 🩺',
    description:
      'Receive an instant diagnosis with the disease name, severity level, and confidence score — all in seconds.',
    icon: '📋',
  },
  {
    title: 'Treatment & Prevention 💡',
    description:
      'PalAI provides treatment recommendations and prevention tips so you can protect your crops and improve your harvest.',
    icon: '🌱',
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const handleComplete = async () => {
    setLoading(true);
    await completeOnboarding();
  };

  const handleSkip = async () => {
    setLoading(true);
    await completeOnboarding();
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-ivory">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-olive-600' : 'bg-ivory-300'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4" aria-hidden="true">
            {step.icon}
          </div>
          <h1 className="text-2xl font-bold mb-3 text-gray-900">{step.title}</h1>
          <p className="text-gray-600 leading-relaxed">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="w-full px-4 py-3 bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Loading...' : isLastStep ? 'Complete' : 'Next'}
          </button>

          {!isLastStep && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              {loading ? 'Loading...' : 'Skip'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
