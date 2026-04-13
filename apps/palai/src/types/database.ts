export type Label = 'HEALTHY' | 'SHEATH_BLIGHT' | 'TUNGRO' | 'RICE_BLAST';

export type Severity = 'LOW' | 'MODERATE' | 'HIGH';

export interface TreatmentStep {
  step: number;
  titleEn: string;
  titleTl: string;
  descriptionEn: string;
  descriptionTl: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'FARMER' | 'ADMIN';
          image_url: string | null;
          is_onboarded: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'FARMER' | 'ADMIN';
          image_url?: string | null;
          is_onboarded?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'FARMER' | 'ADMIN';
          image_url?: string | null;
          is_onboarded?: boolean;
          created_at?: string;
        };
      };
      verification_tokens: {
        Row: {
          identifier: string;
          token: string;
          expires: string;
        };
        Insert: {
          identifier: string;
          token: string;
          expires: string;
        };
        Update: {
          identifier?: string;
          token?: string;
          expires?: string;
        };
      };
      scans: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          label: Label;
          confidence: number;
          severity: Severity;
          explanation_en: string;
          explanation_tl: string;
          cautions: string[];
          prevention_steps: TreatmentStep[];
          treatment_steps: TreatmentStep[];
          sources: Source[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          label: Label;
          confidence: number;
          severity: Severity;
          explanation_en: string;
          explanation_tl: string;
          cautions?: string[];
          prevention_steps?: TreatmentStep[];
          treatment_steps?: TreatmentStep[];
          sources?: Source[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          label?: Label;
          confidence?: number;
          severity?: Severity;
          explanation_en?: string;
          explanation_tl?: string;
          cautions?: string[];
          prevention_steps?: TreatmentStep[];
          treatment_steps?: TreatmentStep[];
          sources?: Source[];
          created_at?: string;
        };
      };
    };
  };
}
