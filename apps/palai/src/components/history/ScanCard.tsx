'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SeverityBadge } from '../result/SeverityBadge';
import { LABEL_LABELS } from '@/lib/constants';
import { ChevronRight, Clock, Trash2 } from 'lucide-react';
import { deleteScan } from '@/app/actions/delete-scan';

interface ScanCardProps {
  scan: {
    id: string;
    image_url: string;
    label: keyof typeof LABEL_LABELS;
    confidence: number;
    severity: 'LOW' | 'MODERATE' | 'HIGH';
    created_at: string;
    explanation_en: string;
  };
}

export function ScanCard({ scan }: ScanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const formattedDate = new Date(scan.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(scan.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteScan(scan.id);
      if (!result.success) {
        alert(`Failed to delete scan: ${result.error}`);
        setIsDeleting(false);
        setShowConfirm(false);
      }
      // If successful, the page will revalidate and the card will disappear
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete scan');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  const isHealthy = scan.label === 'HEALTHY';
  
  return (
    <div className="relative group">
      <Link
        href={`/result/${scan.id}`}
        className={`block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 border border-gray-100 ${
          showConfirm ? 'opacity-50' : ''
        } ${isDeleting ? 'pointer-events-none opacity-30' : 'active:scale-[0.98] hover:border-green-200'}`}
      >
        <div className="flex gap-4 p-4">
          {/* Image Thumbnail with Gradient Overlay */}
          <div className="relative w-24 h-24 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-green-200 transition-all">
            <Image
              src={scan.image_url}
              alt={LABEL_LABELS[scan.label]}
              fill
              className="object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${
              isHealthy ? 'from-green-500/10' : 'from-orange-500/10'
            } to-transparent`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-green-600 transition-colors">
                  {LABEL_LABELS[scan.label]}
                </h3>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>

            <div className="flex items-center gap-2 mb-2.5">
              <SeverityBadge severity={scan.severity} />
            </div>

            {/* Confidence with Progress Bar */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">Confidence</span>
                <span className="font-semibold text-gray-900">{Math.round(scan.confidence * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    scan.confidence >= 0.9 ? 'bg-green-500' : scan.confidence >= 0.7 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${scan.confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate} • {formattedTime}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Delete Button - More subtle */}
      {!showConfirm && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-lg shadow-md hover:bg-red-50 hover:shadow-lg active:scale-90 transition-all disabled:opacity-50 z-10 opacity-0 group-hover:opacity-100"
          aria-label="Delete scan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl z-20">
          <div className="bg-white rounded-xl p-5 shadow-2xl mx-4 max-w-xs border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">Delete Scan?</h3>
            <p className="text-sm text-gray-600 mb-5">
              This will permanently delete this scan and its image.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
