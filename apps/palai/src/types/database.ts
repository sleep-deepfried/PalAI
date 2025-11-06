export type Label =
  | 'HEALTHY'
  | 'BACTERIAL_LEAF_BLIGHT'
  | 'BROWN_SPOT'
  | 'SHEATH_BLIGHT'
  | 'TUNGRO'
  | 'BLAST';

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
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'FARMER' | 'ADMIN';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'FARMER' | 'ADMIN';
          created_at?: string;
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

