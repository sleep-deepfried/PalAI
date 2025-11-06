'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { deleteAllScans } from '@/app/actions/delete-scan';

export function ClearAllButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllScans();
      if (!result.success) {
        alert(`Failed to clear history: ${result.error}`);
      }
      setShowConfirm(false);
    } catch (error) {
      console.error('Clear all error:', error);
      alert('Failed to clear history');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-sm text-white/90 hover:text-white font-medium active:scale-95 transition-transform bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20"
      >
        Clear All
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Clear All History?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete all scans and their images. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-transform disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

