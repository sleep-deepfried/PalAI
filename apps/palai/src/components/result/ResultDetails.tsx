'use client';

import { useState, useEffect } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { TreatmentGuide } from './TreatmentGuide';
import type { TreatmentStep, Source } from '@/types/database';

interface ResultDetailsProps {
  scanId: string;
  disease: string;
  explanationEn: string;
  explanationTl: string;
  preventionSteps: TreatmentStep[];
  treatmentSteps: TreatmentStep[];
  sources: Source[];
  cautions: string[];
}

export function ResultDetails({
  scanId,
  disease,
  explanationEn,
  explanationTl,
  preventionSteps: initialPreventionSteps,
  treatmentSteps: initialTreatmentSteps,
  sources: initialSources,
  cautions,
}: ResultDetailsProps) {
  const [language, setLanguage] = useState<'en' | 'tl'>('tl');
  const [preventionSteps, setPreventionSteps] = useState<TreatmentStep[]>(initialPreventionSteps);
  const [treatmentSteps, setTreatmentSteps] = useState<TreatmentStep[]>(initialTreatmentSteps);
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch treatment data if not already cached
  useEffect(() => {
    const fetchTreatmentData = async () => {
      // If we already have treatment data, skip
      if (initialPreventionSteps.length > 0 || initialTreatmentSteps.length > 0) {
        return;
      }

      // Skip for healthy plants
      if (disease === 'HEALTHY') {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/treatment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disease, language }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch treatment data');
        }

        const data = await response.json();
        
        setPreventionSteps(data.preventionSteps || []);
        setTreatmentSteps(data.treatmentSteps || []);
        setSources(data.sources || []);

        // Update the database with the fetched treatment data
        await fetch('/api/scans/update-treatment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanId,
            preventionSteps: data.preventionSteps,
            treatmentSteps: data.treatmentSteps,
            sources: data.sources,
          }),
        });
      } catch (err: any) {
        console.error('Error fetching treatment data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTreatmentData();
  }, [scanId, disease, initialPreventionSteps.length, initialTreatmentSteps.length]);

  return (
    <>
      {/* Language Switcher with Explanation */}
      <div className="bg-white rounded-2xl p-5 shadow-md">
        <LanguageSwitcher
          explanationEn={explanationEn}
          explanationTl={explanationTl}
          language={language}
          onLanguageChange={setLanguage}
        />
      </div>

      {/* Cautions */}
      {cautions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-amber-900 mb-3">⚠️ {language === 'en' ? 'Cautions' : 'Babala'}</h3>
          <ul className="space-y-2">
            {cautions.map((caution, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>{String(caution)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Treatment Guide */}
      {loading ? (
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">
              {language === 'en' ? 'Loading treatment guide...' : 'Kinukuha ang treatment guide...'}
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-sm text-red-800">
            {language === 'en' 
              ? 'Failed to load treatment guide. Please refresh the page.' 
              : 'Hindi ma-load ang treatment guide. Paki-refresh ang page.'}
          </p>
        </div>
      ) : (
        <TreatmentGuide
          preventionSteps={preventionSteps}
          treatmentSteps={treatmentSteps}
          sources={sources}
          language={language}
        />
      )}
    </>
  );
}

