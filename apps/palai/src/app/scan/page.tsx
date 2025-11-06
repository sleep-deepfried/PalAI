'use client';

import { useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { CameraCapture } from '@/components/scan/CameraCapture';
import { ImageUpload } from '@/components/scan/ImageUpload';
import { ImagePreview } from '@/components/scan/ImagePreview';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Step } from '@/components/ui/MultiStepProgress';
import { uploadAndDiagnose } from '../actions/scan';
import { redirect } from 'next/navigation';

type Tab = 'camera' | 'upload';

export default function ScanPage() {
  const [activeTab, setActiveTab] = useState<Tab>('camera');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locale, setLocale] = useState<'en' | 'tl'>('en');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);

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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-4 safe-area-top">
        <h1 className="text-xl font-bold">Scan Rice Leaf</h1>
        <p className="text-sm text-gray-400">Take a photo or upload an image</p>
      </div>

      {/* Tab Selector */}
      <div className="bg-gray-800 px-4 py-3">
        <div className="flex gap-2 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'camera'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative">
        {activeTab === 'camera' ? (
          <CameraCapture onCapture={handleImageCapture} />
        ) : (
          <div className="h-full flex items-center justify-center px-4">
            <ImageUpload onImageSelect={handleImageUpload} />
          </div>
        )}
      </div>
    </div>
  );
}
