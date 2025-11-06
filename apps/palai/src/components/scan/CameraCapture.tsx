'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X, RotateCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File, dataUrl: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error('Error playing video:', err);
      });
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsReady(false);
      
      // Try with facing mode first
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      } catch (facingModeError) {
        // Fallback if facing mode not supported
        console.log('Facing mode not supported, using default camera');
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      }
      
      setStream(mediaStream);
      setIsReady(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(file, dataUrl);
      }
    }, 'image/jpeg', 0.95);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 px-6">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Camera Access Denied</h3>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 active:scale-95 transition-transform"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ minHeight: '100%' }}
      />

      {/* Guide Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-80 h-80 max-w-[85vw] max-h-[85vw]">
          <div className="absolute inset-0 border-2 border-white rounded-2xl opacity-50"></div>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-2xl"></div>
        </div>
      </div>

      {/* Instruction Text */}
      {isReady && (
        <div className="absolute top-20 left-0 right-0 text-center px-4 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm inline-block px-4 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">
              Position rice leaf inside the frame
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 safe-area-bottom">
        <div className="flex items-center justify-center gap-8 px-4">
          {/* Flip Camera */}
          <button
            onClick={toggleCamera}
            disabled={!isReady}
            className="w-14 h-14 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-gray-700 active:scale-95 transition-transform disabled:opacity-50"
          >
            <RotateCw className="w-6 h-6" />
          </button>

          {/* Capture Button */}
          <button
            onClick={handleCapture}
            disabled={!isReady}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-transform disabled:opacity-50 disabled:bg-gray-400 shadow-lg"
          >
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </button>

          {/* Placeholder for balance */}
          <div className="w-14 h-14"></div>
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
