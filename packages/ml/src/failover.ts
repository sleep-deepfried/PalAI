import type { DiagnoseInput, DiagnoseOutput } from './types';
import { N8nProvider } from './providers/n8n';
import { NextApiProvider } from './providers/nextapi';
import { LocalMockProvider } from './providers/local';
import { validateAndClampDiagnoseOutput } from './schema';

export async function diagnoseWithFailover(
  input: DiagnoseInput,
  providers: {
    n8n?: { webhookUrl: string; signingSecret?: string };
    nextApi?: { baseUrl?: string };
    local?: boolean;
  }
): Promise<DiagnoseOutput> {
  const { n8n, nextApi, local = true } = providers;

  // Try n8n first
  if (n8n && n8n.webhookUrl) {
    try {
      const provider = new N8nProvider(n8n.webhookUrl, n8n.signingSecret);
      const result = await provider.diagnose(input);
      return validateAndClampDiagnoseOutput(result);
    } catch (error) {
      console.error('N8n provider failed:', error);
    }
  }

  // Try Next API fallback
  if (nextApi) {
    try {
      const provider = new NextApiProvider(nextApi.baseUrl);
      const result = await provider.diagnose(input);
      return validateAndClampDiagnoseOutput(result);
    } catch (error) {
      console.error('Next API provider failed:', error);
    }
  }

  // Use local mock as last resort
  if (local) {
    const provider = new LocalMockProvider();
    const result = await provider.diagnose(input);
    console.log('Local mock result before validation:', JSON.stringify(result, null, 2));
    // Validate the local mock result too
    try {
      return validateAndClampDiagnoseOutput(result);
    } catch (validationError) {
      console.error('Local mock validation failed:', validationError);
      throw validationError;
    }
  }

  throw new Error('All providers failed and local mock is disabled');
}

// Export types and providers
export * from './types';
export * from './schema';
export { N8nProvider } from './providers/n8n';
export { NextApiProvider } from './providers/nextapi';
export { LocalMockProvider } from './providers/local';

