'use client';

interface ShareLinkProps {
  shareUrl: string;
}

export function ShareLink({ shareUrl }: ShareLinkProps) {
  if (!shareUrl) return null;

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium mb-2">Share Link</label>
      <input
        type="text"
        value={shareUrl}
        readOnly
        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
        onClick={(e) => (e.target as HTMLInputElement).select()}
      />
    </div>
  );
}

