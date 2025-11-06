import { z } from 'zod';
import type { Label, Severity, DiagnoseOutput } from './types';

export const LabelSchema = z.enum([
  'HEALTHY',
  'BACTERIAL_LEAF_BLIGHT',
  'BROWN_SPOT',
  'SHEATH_BLIGHT',
  'TUNGRO',
  'BLAST',
]);

export const SeveritySchema = z.enum(['LOW', 'MODERATE', 'HIGH']);

export const TreatmentStepSchema = z.object({
  step: z.number(),
  titleEn: z.string(),
  titleTl: z.string(),
  descriptionEn: z.string(),
  descriptionTl: z.string(),
});

export const DiagnoseOutputSchema = z.object({
  label: LabelSchema,
  confidence: z.number().min(0).max(1),
  severity: SeveritySchema,
  explanationEn: z.string(),
  explanationTl: z.string(),
  cautions: z.array(z.string()),
  preventionSteps: z.array(TreatmentStepSchema).optional(),
  treatmentSteps: z.array(TreatmentStepSchema).optional(),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
  })).optional(),
});

export function validateAndClampDiagnoseOutput(
  raw: unknown
): DiagnoseOutput {
  const parsed = DiagnoseOutputSchema.parse(raw);
  return {
    ...parsed,
    confidence: Math.max(0, Math.min(1, parsed.confidence)),
  };
}

