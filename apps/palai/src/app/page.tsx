import Link from 'next/link';
import { Camera, History, Leaf, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-4 py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Leaf className="w-10 h-10" />
            <h1 className="text-4xl font-bold">PalAI</h1>
          </div>
          <p className="text-lg text-green-50">
            AI-powered rice leaf disease detection para sa Filipino farmers
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Primary CTA */}
        <Link
          href="/scan"
          className="block w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl p-6 shadow-lg active:scale-95 transition-transform mb-4"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Camera className="w-8 h-8" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xl font-bold mb-1">Scan Rice Leaf</div>
              <div className="text-sm text-green-50">
                Take a photo or upload image
              </div>
            </div>
          </div>
        </Link>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            href="/history"
            className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow active:scale-95"
          >
            <History className="w-7 h-7 text-blue-600 mb-3" />
            <div className="text-sm font-semibold text-gray-900">History</div>
            <div className="text-xs text-gray-500">View past scans</div>
          </Link>
          
          <Link
            href="/admin"
            className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow active:scale-95"
          >
            <Shield className="w-7 h-7 text-purple-600 mb-3" />
            <div className="text-sm font-semibold text-gray-900">Statistics</div>
            <div className="text-xs text-gray-500">View insights</div>
          </Link>
        </div>

        {/* Info Cards */}
        <div className="bg-white rounded-xl p-5 shadow-md space-y-4">
          <h2 className="font-semibold text-gray-900 text-lg">How it works</h2>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Take a photo</div>
                <div className="text-xs text-gray-600">Capture rice leaf using your camera</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">AI Analysis</div>
                <div className="text-xs text-gray-600">Get instant disease detection</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Get recommendations</div>
                <div className="text-xs text-gray-600">Receive treatment advice</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
