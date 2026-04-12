import type { DiagnoseInput, DiagnoseOutput } from './types';
import { NextApiProvider } from './providers/nextapi';
import { LocalMockProvider } from './providers/local';
import { validateAndClampDiagnoseOutput } from './schema';

export async function diagnoseWithFailover(
  input: DiagnoseInput,
  providers: {
    nextApi?: { baseUrl?: string; headers?: Record<string, string> };
    local?: boolean;
  }
): Promise<DiagnoseOutput> {
  const { nextApi, local = true } = providers;

  // Try Next API first
  if (nextApi) {
    try {
      const provider = new NextApiProvider(nextApi.baseUrl, nextApi.headers);
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
export { NextApiProvider } from './providers/nextapi';
export { LocalMockProvider } from './providers/local';
