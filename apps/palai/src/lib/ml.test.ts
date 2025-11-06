import { describe, it, expect } from 'vitest';
import { LocalMockProvider } from '@palai/ml';

describe('LocalMockProvider', () => {
  it('should return deterministic results', async () => {
    const provider = new LocalMockProvider();
    const buffer = Buffer.from('test image data');

    const result1 = await provider.diagnose({
      imageBuffer: buffer,
      mimeType: 'image/jpeg',
    });

    const result2 = await provider.diagnose({
      imageBuffer: buffer,
      mimeType: 'image/jpeg',
    });

    // Should be deterministic
    expect(result1.label).toBe(result2.label);
    expect(result1.confidence).toBe(result2.confidence);
    expect(result1.severity).toBe(result2.severity);
  });

  it('should return valid diagnose output structure', async () => {
    const provider = new LocalMockProvider();
    const buffer = Buffer.from('test');

    const result = await provider.diagnose({
      imageBuffer: buffer,
      mimeType: 'image/jpeg',
    });

    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('severity');
    expect(result).toHaveProperty('explanationEn');
    expect(result).toHaveProperty('explanationTl');
    expect(result).toHaveProperty('cautions');

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

