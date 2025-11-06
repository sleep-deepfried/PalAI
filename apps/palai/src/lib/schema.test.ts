import { describe, it, expect } from 'vitest';
import { validateAndClampDiagnoseOutput, LabelSchema, SeveritySchema } from '@palai/ml';

describe('Schema Validation', () => {
  it('should validate correct diagnose output', () => {
    const valid = {
      label: 'HEALTHY' as const,
      confidence: 0.85,
      severity: 'LOW' as const,
      explanationEn: 'Healthy leaf',
      explanationTl: 'Healthy ang dahon',
      cautions: [],
    };

    const result = validateAndClampDiagnoseOutput(valid);
    expect(result).toEqual(valid);
  });

  it('should clamp confidence to 0-1 range', () => {
    const highConfidence = {
      label: 'BLAST' as const,
      confidence: 1.5,
      severity: 'HIGH' as const,
      explanationEn: 'Test',
      explanationTl: 'Test',
      cautions: [],
    };

    const result = validateAndClampDiagnoseOutput(highConfidence);
    expect(result.confidence).toBe(1);

    const lowConfidence = {
      ...highConfidence,
      confidence: -0.5,
    };

    const result2 = validateAndClampDiagnoseOutput(lowConfidence);
    expect(result2.confidence).toBe(0);
  });

  it('should reject invalid label', () => {
    const invalid = {
      label: 'INVALID' as any,
      confidence: 0.5,
      severity: 'LOW' as const,
      explanationEn: 'Test',
      explanationTl: 'Test',
      cautions: [],
    };

    expect(() => validateAndClampDiagnoseOutput(invalid)).toThrow();
  });

  it('should reject invalid severity', () => {
    const invalid = {
      label: 'HEALTHY' as const,
      confidence: 0.5,
      severity: 'INVALID' as any,
      explanationEn: 'Test',
      explanationTl: 'Test',
      cautions: [],
    };

    expect(() => validateAndClampDiagnoseOutput(invalid)).toThrow();
  });
});

describe('Label Schema', () => {
  it('should accept valid labels', () => {
    const validLabels = [
      'HEALTHY',
      'BACTERIAL_LEAF_BLIGHT',
      'BROWN_SPOT',
      'SHEATH_BLIGHT',
      'TUNGRO',
      'BLAST',
    ];

    validLabels.forEach((label) => {
      expect(() => LabelSchema.parse(label)).not.toThrow();
    });
  });

  it('should reject invalid labels', () => {
    expect(() => LabelSchema.parse('INVALID')).toThrow();
  });
});

describe('Severity Schema', () => {
  it('should accept valid severities', () => {
    const validSeverities = ['LOW', 'MODERATE', 'HIGH'];

    validSeverities.forEach((severity) => {
      expect(() => SeveritySchema.parse(severity)).not.toThrow();
    });
  });

  it('should reject invalid severities', () => {
    expect(() => SeveritySchema.parse('INVALID')).toThrow();
  });
});
