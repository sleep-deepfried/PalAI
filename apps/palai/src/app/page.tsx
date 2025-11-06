import Link from 'next/link';
import { Camera, History, Leaf, Shield, Zap, Brain, CheckCircle, AlertTriangle, Info, BarChart3, Droplets, Bug } from 'lucide-react';

const diseases = [
  {
    id: 'BLAST',
    name: 'Blast',
    nameTl: 'Blast',
    description: 'Diamond-shaped lesions on leaves',
    descriptionTl: 'Mga dahon na may hugis-brilyante na pinsala',
    severity: 'HIGH' as const,
    icon: AlertTriangle,
  },
  {
    id: 'BACTERIAL_LEAF_BLIGHT',
    name: 'Bacterial Leaf Blight',
    nameTl: 'Bacterial Leaf Blight',
    description: 'Yellow-green lesions with wavy margins',
    descriptionTl: 'Dilaw-berdeng pinsala na may kulubot na gilid',
    severity: 'HIGH' as const,
    icon: Bug,
  },
  {
    id: 'BROWN_SPOT',
    name: 'Brown Spot',
    nameTl: 'Kayumangging Batik',
    description: 'Circular brown spots on leaves',
    descriptionTl: 'Bilog na kayumangging batik sa dahon',
    severity: 'MODERATE' as const,
    icon: Info,
  },
  {
    id: 'SHEATH_BLIGHT',
    name: 'Sheath Blight',
    nameTl: 'Sheath Blight',
    description: 'Irregular greenish-gray lesions',
    descriptionTl: 'Hindi regular na berde-abuhing pinsala',
    severity: 'MODERATE' as const,
    icon: Droplets,
  },
  {
    id: 'TUNGRO',
    name: 'Tungro',
    nameTl: 'Tungro',
    description: 'Yellow-orange discoloration of leaves',
    descriptionTl: 'Dilaw-kahel na pagkupas ng dahon',
    severity: 'HIGH' as const,
    icon: AlertTriangle,
  },
];

const severityColors = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MODERATE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-50 text-green-700 border-green-200',
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white px-4 py-10 sm:py-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-32 translate-y-32"></div>
        </div>

        <div className="max-w-lg mx-auto relative z-10">
          {/* Logo & Title with Animation */}
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Leaf className="w-10 h-10" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">PalAI</h1>
          </div>
          
          <p className="text-lg sm:text-xl text-green-50 mb-6 animate-fade-in-delay-1">
            AI-powered rice leaf disease detection para sa Filipino farmers
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-3 mb-6 animate-fade-in-delay-2">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
              <Zap className="w-4 h-4" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
              <Brain className="w-4 h-4" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Expert Advice</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 animate-fade-in-delay-3">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg py-3">
              <div className="text-2xl font-bold">5+</div>
              <div className="text-xs text-green-100">Diseases</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg py-3">
              <div className="text-2xl font-bold">Fast</div>
              <div className="text-xs text-green-100">Analysis</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg py-3">
              <div className="text-2xl font-bold">Free</div>
              <div className="text-xs text-green-100">To Use</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full pb-20">
        {/* Primary CTA with Pulse Animation */}
        <Link
          href="/scan"
          className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-200 mb-6 animate-float"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/30 p-4 rounded-xl backdrop-blur-sm">
              <Camera className="w-8 h-8" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xl font-bold mb-1">Scan Rice Leaf Now</div>
              <div className="text-sm text-green-50">
                Take a photo or upload image
              </div>
            </div>
            <div className="text-2xl">→</div>
          </div>
        </Link>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/history"
            className="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 active:scale-95 border border-gray-100 group"
          >
            <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-sm font-semibold text-gray-900">History</div>
            <div className="text-xs text-gray-500">View past scans</div>
          </Link>
          
          <Link
            href="/stats"
            className="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 active:scale-95 border border-gray-100 group"
          >
            <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-sm font-semibold text-gray-900">Insights</div>
            <div className="text-xs text-gray-500">View analytics</div>
          </Link>
        </div>

        {/* How It Works - Enhanced */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-8 border border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
            <span className="text-2xl">📱</span>
            How it works
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-start group">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Take a photo</div>
                <div className="text-sm text-gray-600">Capture or upload a clear image of the rice leaf</div>
              </div>
            </div>
            
            <div className="flex gap-4 items-start group">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">AI Analysis</div>
                <div className="text-sm text-gray-600">Our AI instantly analyzes the leaf for diseases</div>
              </div>
            </div>
            
            <div className="flex gap-4 items-start group">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Get treatment guide</div>
                <div className="text-sm text-gray-600">Receive detailed advice in English & Tagalog</div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Diseases Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              Common Rice Diseases
            </h2>
          </div>
          
          <div className="space-y-3">
            {diseases.map((disease, index) => {
              const Icon = disease.icon;
              return (
                <div
                  key={disease.id}
                  className={`bg-white rounded-xl p-4 shadow-md border hover:shadow-lg transition-all duration-200 ${severityColors[disease.severity]} animate-slide-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      disease.severity === 'HIGH' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        disease.severity === 'HIGH' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{disease.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          disease.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {disease.severity === 'HIGH' ? 'High Risk' : 'Moderate'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{disease.description}</p>
                      <p className="text-xs text-gray-500 italic">{disease.descriptionTl}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm group"
            >
              Scan your leaf to identify disease
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white text-center shadow-xl">
          <h3 className="font-bold text-lg mb-2">Ready to protect your crops?</h3>
          <p className="text-sm text-green-50 mb-4">Start scanning rice leaves now for free</p>
          <Link
            href="/scan"
            className="inline-block bg-white text-green-600 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 active:scale-95 transition-all shadow-lg"
          >
            Start Scanning
          </Link>
        </div>
      </div>
    </div>
  );
}
