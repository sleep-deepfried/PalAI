import { createHmac } from 'crypto';
import type { PalAIProvider, DiagnoseInput, DiagnoseOutput } from '../types';
import { validateAndClampDiagnoseOutput } from '../schema';

export class N8nProvider implements PalAIProvider {
  private webhookUrl: string;
  private signingSecret?: string;

  constructor(webhookUrl: string, signingSecret?: string) {
    this.webhookUrl = webhookUrl;
    this.signingSecret = signingSecret;
  }

  async diagnose(input: DiagnoseInput): Promise<DiagnoseOutput> {
    const imageBase64 = input.imageBuffer.toString('base64');
    const locale = input.promptExtras?.locale || 'en';
    const fieldNotes = input.promptExtras?.fieldNotes || '';

    const body = JSON.stringify({
      imageBase64,
      mimeType: input.mimeType,
      locale,
      fieldNotes,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add HMAC signature if secret is provided
    if (this.signingSecret) {
      const signature = createHmac('sha256', this.signingSecret)
        .update(body)
        .digest('hex');
      headers['x-signature'] = signature;
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(
        `N8n provider failed: ${response.status} ${response.statusText}`
      );
    }

    const json = await response.json();
    return validateAndClampDiagnoseOutput(json);
  }
}

