'use client';

import { useState } from 'react';
import { Sprout, Shield, ExternalLink } from 'lucide-react';

interface TreatmentStep {
  step: number;
  titleEn: string;
  titleTl: string;
  descriptionEn: string;
  descriptionTl: string;
}

interface Source {
  title: string;
  url: string;
}

interface TreatmentGuideProps {
  preventionSteps?: TreatmentStep[];
  treatmentSteps?: TreatmentStep[];
  sources?: Source[];
  language: 'en' | 'tl';
}

export function TreatmentGuide({ 
  preventionSteps = [], 
  treatmentSteps = [], 
  sources = [],
  language 
}: TreatmentGuideProps) {
  const [activeTab, setActiveTab] = useState<'prevention' | 'treatment'>('prevention');

  if (preventionSteps.length === 0 && treatmentSteps.length === 0) {
    return null;
  }

  const activeSteps = activeTab === 'prevention' ? preventionSteps : treatmentSteps;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {preventionSteps.length > 0 && (
          <button
            onClick={() => setActiveTab('prevention')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'prevention'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            {language === 'en' ? 'Prevention' : 'Pag-iwas'}
          </button>
        )}
        {treatmentSteps.length > 0 && (
          <button
            onClick={() => setActiveTab('treatment')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'treatment'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sprout className="w-4 h-4" />
            {language === 'en' ? 'Treatment' : 'Paggamot'}
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-6">
        {activeSteps.map((step, index) => (
          <div key={index} className="flex gap-4">
            {/* Step Number */}
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm">
              {step.step}
            </div>
            
            {/* Step Content */}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {language === 'en' ? step.titleEn : step.titleTl}
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {language === 'en' ? step.descriptionEn : step.descriptionTl}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            📚 {language === 'en' ? 'Learn More' : 'Magbasa Pa'}
          </h4>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

