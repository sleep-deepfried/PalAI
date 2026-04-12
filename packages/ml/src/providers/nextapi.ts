import type { PalAIProvider, DiagnoseInput, DiagnoseOutput } from '../types';
import { validateAndClampDiagnoseOutput } from '../schema';

export class NextApiProvider implements PalAIProvider {
  private baseUrl: string;

  private extraHeaders: Record<string, string>;

  constructor(baseUrl: string = '', extraHeaders: Record<string, string> = {}) {
    this.baseUrl = (baseUrl ?? '').replace(/\/$/, '');
    this.extraHeaders = extraHeaders;
  }

  async diagnose(input: DiagnoseInput): Promise<DiagnoseOutput> {
    const imageBase64 = input.imageBuffer.toString('base64');
    const locale = input.promptExtras?.locale || 'en';
    const fieldNotes = input.promptExtras?.fieldNotes || '';

    const response = await fetch(`${this.baseUrl}/api/ai/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.extraHeaders,
      },
      body: JSON.stringify({
        imageBase64,
        mimeType: input.mimeType,
        locale,
        fieldNotes,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Next API provider failed: ${response.status} ${response.statusText}`
      );
    }

    const json = await response.json();
    return validateAndClampDiagnoseOutput(json);
  }
}

