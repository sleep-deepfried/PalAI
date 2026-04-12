import { describe, it, expect, vi } from 'vitest';
import { extractDiagnosis } from './diagnosis-extractor';

const VALID_DIAGNOSIS = {
  label: 'BLAST',
  confidence: 0.87,
  severity: 'HIGH',
  explanationEn: 'Signs of rice blast detected on the leaf.',
  explanationTl: 'May signs ng Blast sa dahon.',
  cautions: ['Slightly blurry image'],
};

function makeSend() {
  return vi.fn() as (text: string) => void;
}

function makeWait(response: string) {
  const fn = vi.fn().mockResolvedValue(response);
  return fn as unknown as (() => Promise<string>) & { mock: typeof fn.mock };
}

function makeWaitSequence(...responses: string[]) {
  const fn = vi.fn();
  for (const r of responses) {
    fn.mockResolvedValueOnce(r);
  }
  return fn as unknown as (() => Promise<string>) & { mock: typeof fn.mock };
}

describe('extractDiagnosis', () => {
  it('returns a validated diagnosis from clean JSON', async () => {
    const send = makeSend();
    const wait = makeWait(JSON.stringify(VALID_DIAGNOSIS));

    const result = await extractDiagnosis(send, wait);

    expect(result.success).toBe(true);
    expect(result.diagnosis).toBeDefined();
    expect(result.diagnosis!.label).toBe('BLAST');
    expect(result.diagnosis!.confidence).toBe(0.87);
    expect(result.diagnosis!.severity).toBe('HIGH');
    expect(vi.mocked(send)).toHaveBeenCalledOnce();
  });

  it('extracts JSON from markdown code fences', async () => {
    const fenced = '```json\n' + JSON.stringify(VALID_DIAGNOSIS) + '\n```';
    const send = makeSend();
    const wait = makeWait(fenced);

    const result = await extractDiagnosis(send, wait);

    expect(result.success).toBe(true);
    expect(result.diagnosis!.label).toBe('BLAST');
  });

  it('extracts JSON embedded in surrounding text', async () => {
    const wrapped =
      'Here is the diagnosis:\n' + JSON.stringify(VALID_DIAGNOSIS) + '\nHope this helps!';
    const send = makeSend();
    const wait = makeWait(wrapped);

    const result = await extractDiagnosis(send, wait);

    expect(result.success).toBe(true);
    expect(result.diagnosis!.label).toBe('BLAST');
  });

  it('retries once on invalid JSON and succeeds on second attempt', async () => {
    const send = makeSend();
    const wait = makeWaitSequence('not json at all', JSON.stringify(VALID_DIAGNOSIS));

    const result = await extractDiagnosis(send, wait);

    expect(result.success).toBe(true);
    expect(vi.mocked(send)).toHaveBeenCalledTimes(2);
    expect(wait.mock.calls).toHaveLength(2);
  });

  it('fails after retry when both attempts return invalid JSON', async () => {
    const send = makeSend();
    const wait = makeWait('this is not json');

    const result = await extractDiagnosis(send, wait);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Extraction failed after retry');
    expect(vi.mocked(send)).toHaveBeenCalledTimes(2);
  });

  it('does not retry when retryOnce is false', async () => {
    const send = makeSend();
    const wait = makeWait('bad json');

    const result = await extractDiagnosis(send, wait, false);

    expect(result.success).toBe(false);
    expect(vi.mocked(send)).toHaveBeenCalledOnce();
  });

  it('fails on empty response', async () => {
    const send = makeSend();
    const wait = makeWait('');

    const result = await extractDiagnosis(send, wait, false);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Empty response');
  });

  it('fails validation for invalid label', async () => {
    const invalid = { ...VALID_DIAGNOSIS, label: 'INVALID_DISEASE' };
    const send = makeSend();
    const wait = makeWait(JSON.stringify(invalid));

    const result = await extractDiagnosis(send, wait, false);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation failed');
  });

  it('clamps out-of-range confidence to valid range', async () => {
    const highConf = { ...VALID_DIAGNOSIS, confidence: 1.5 };
    const send = makeSend();
    const wait = makeWait(JSON.stringify(highConf));

    const result = await extractDiagnosis(send, wait, false);

    expect(result.success).toBe(true);
    expect(result.diagnosis?.confidence).toBe(1);
  });

  it('sends the correct extraction prompt', async () => {
    const send = makeSend();
    const wait = makeWait(JSON.stringify(VALID_DIAGNOSIS));

    await extractDiagnosis(send, wait);

    expect(vi.mocked(send)).toHaveBeenCalledWith(
      expect.stringContaining('provide your final diagnosis as a JSON object')
    );
  });
});
