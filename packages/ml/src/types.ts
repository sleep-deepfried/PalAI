export type Label =
  | 'HEALTHY'
  | 'BACTERIAL_LEAF_BLIGHT'
  | 'BROWN_SPOT'
  | 'SHEATH_BLIGHT'
  | 'TUNGRO'
  | 'BLAST';

export type Severity = 'LOW' | 'MODERATE' | 'HIGH';

export interface DiagnoseInput {
  imageBuffer: Buffer;
  mimeType: string;
  promptExtras?: {
    locale?: 'en' | 'tl';
    fieldNotes?: string;
  };
}

export interface TreatmentStep {
  step: number;
  titleEn: string;
  titleTl: string;
  descriptionEn: string;
  descriptionTl: string;
}

export interface DiagnoseOutput {
  label: Label;
  confidence: number;
  severity: Severity;
  explanationEn: string;
  explanationTl: string;
  cautions: string[];
  preventionSteps?: TreatmentStep[];
  treatmentSteps?: TreatmentStep[];
  sources?: Array<{
    title: string;
    url: string;
  }>;
}

export interface PalAIProvider {
  diagnose(input: DiagnoseInput): Promise<DiagnoseOutput>;
}

