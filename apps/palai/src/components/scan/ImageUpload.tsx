'use client';

import { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
}

export function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const validateAndSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    onImageSelect(file);
  };

  return (
    <div className="w-full max-w-md">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
          isDragging
            ? 'border-green-400 bg-green-50/50'
            : 'border-gray-300 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-gray-400" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Rice Leaf Image
          </h3>

          <p className="text-sm text-gray-500 mb-6">
            Drag and drop or tap to browse
          </p>

          <button
            onClick={() => inputRef.current?.click()}
            className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Choose Image
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Supported: JPG, PNG, WebP (Max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
}
