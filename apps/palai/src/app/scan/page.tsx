'use client';

import { useState, useEffect } from 'react';
import { CameraCapture } from '@/components/scan/CameraCapture';
import { ImagePreview } from '@/components/scan/ImagePreview';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Step } from '@/components/ui/MultiStepProgress';
import { uploadAndDiagnose } from '../actions/scan';
import { redirect } from 'next/navigation';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function ScanPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locale, setLocale] = useState<'en' | 'tl'>('en');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Request fullscreen on mount (requires user interaction to work)
  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        // Fullscreen request failed or was denied - that's okay
        console.log('Fullscreen not available or denied');
      }
    };

    // Small delay to allow for user interaction
    const timer = setTimeout(requestFullscreen, 300);

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  const handleImageCapture = (file: File, dataUrl: string) => {
    setSelectedImage(file);
    setPreview(dataUrl);
  };

  const handleImageUpload = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const simulateProgress = (step: number, startPercent: number, endPercent: number, duration: number, message: string) => {
    return new Promise<void>((resolve) => {
      setCurrentStep(step);
      setStatusMessage(message);
      
      const steps = 20;
      const increment = (endPercent - startPercent) / steps;
      const interval = duration / steps;
      
      let current = startPercent;
      const timer = setInterval(() => {
        if (isCancelled) {
          clearInterval(timer);
          resolve();
          return;
        }
        
        current += increment;
        setProgress(Math.min(current, endPercent));
        
        if (current >= endPercent) {
          clearInterval(timer);
          resolve();
        }
      }, interval);
    });
  };

  const handleSubmit = async () => {
    if (!selectedImage) return;

    setIsSubmitting(true);
    setIsCancelled(false);
    setProgress(0);
    setCurrentStep(0);
    
    try {
      // Step 1: Uploading (0-25%)
      await simulateProgress(0, 0, 25, 800, 'Preparing image for upload...');
      if (isCancelled) throw new Error('Cancelled');
      
      // Step 2: Processing (25-50%)
      setCurrentStep(1);
      setStatusMessage('Processing image...');
      setProgress(25);
      
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('locale', locale);
      
      await simulateProgress(1, 25, 50, 1000, 'Optimizing image quality...');
      if (isCancelled) throw new Error('Cancelled');
      
      // Step 3: AI Analysis (50-95%)
      setCurrentStep(2);
      setStatusMessage('Analyzing with AI...');
      setProgress(50);
      
      // Start the actual upload in background
      const uploadPromise = uploadAndDiagnose(formData);
      
      // Simulate AI progress
      await simulateProgress(2, 50, 95, 8000, 'AI diagnosing disease...');
      if (isCancelled) throw new Error('Cancelled');
      
      // Wait for actual upload to complete
      await uploadPromise;
      
      // Step 4: Complete (95-100%)
      setCurrentStep(3);
      setStatusMessage('Saving results...');
      await simulateProgress(3, 95, 100, 500, 'Almost done...');
      
    } catch (error: any) {
      if (error?.message === 'Cancelled') {
        setIsSubmitting(false);
        setProgress(0);
        setCurrentStep(0);
        return;
      }
      
      // Check if this is a redirect error (expected behavior)
      if (error?.message?.includes('NEXT_REDIRECT')) {
        // This is expected - redirect() throws to stop execution
        return;
      }
      
      // Only show alert for actual errors
      console.error('Upload error:', error);
      alert('Failed to diagnose image. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsCancelled(true);
    setIsSubmitting(false);
    setProgress(0);
    setCurrentStep(0);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreview(null);
    setProgress(0);
    setCurrentStep(0);
    setIsCancelled(false);
  };

  const steps: Step[] = [
    { label: 'Upload', status: currentStep > 0 ? 'complete' : currentStep === 0 ? 'active' : 'pending' },
    { label: 'Process', status: currentStep > 1 ? 'complete' : currentStep === 1 ? 'active' : 'pending' },
    { label: 'AI Analysis', status: currentStep > 2 ? 'complete' : currentStep === 2 ? 'active' : 'pending' },
    { label: 'Complete', status: currentStep === 3 ? 'complete' : 'pending' },
  ];

  if (preview && selectedImage) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <ImagePreview
            preview={preview}
            locale={locale}
            onLocaleChange={setLocale}
            onReset={handleReset}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
        
        {/* Loading Overlay */}
        {isSubmitting && (
          <LoadingOverlay
            steps={steps}
            currentStep={currentStep}
            percentage={progress}
            message={statusMessage}
            estimatedTime="5-15 seconds remaining"
            onCancel={handleCancel}
            showCancel={true}
          />
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden z-10">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white px-5 py-6 safe-area-top flex-shrink-0 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-x-24 -translate-y-24"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-32 translate-y-32"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Scan Rice Leaf</h1>
            </div>
            
            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg active:scale-95 transition-all"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-sm text-green-100 ml-[52px]">Position leaf inside the frame and capture</p>
        </div>
      </div>

      {/* Content Area - Camera */}
      <div className="flex-1 relative overflow-hidden pb-20">
        <CameraCapture onCapture={handleImageCapture} onUpload={handleImageUpload} />
      </div>
    </div>
  );
}
