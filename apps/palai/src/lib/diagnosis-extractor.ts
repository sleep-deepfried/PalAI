import { validateAndClampDiagnoseOutput, type DiagnoseOutput } from '@palai/ml';

export interface StructuredDiagnosis {
  label: 'HEALTHY' | 'BACTERIAL_LEAF_BLIGHT' | 'BROWN_SPOT' | 'SHEATH_BLIGHT' | 'TUNGRO' | 'BLAST';
  confidence: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  explanationEn: string;
  explanationTl: string;
  cautions: string[];
}

export interface ExtractDiagnosisResult {
  success: boolean;
  diagnosis?: StructuredDiagnosis;
  error?: string;
}

const EXTRACTION_PROMPT =
  'Based on our conversation about the rice leaves, provide your final diagnosis as a JSON object with these exact keys: label (one of HEALTHY, BACTERIAL_LEAF_BLIGHT, BROWN_SPOT, SHEATH_BLIGHT, TUNGRO, BLAST), confidence (0 to 1), severity (LOW, MODERATE, or HIGH), explanationEn (English), explanationTl (Tagalog), cautions (array of strings). Return ONLY the JSON, no other text.';

/**
 * Extracts a JSON block from a text response that may contain markdown
 * fences or surrounding prose.
 */
function extractJsonFromText(text: string): string {
  // Try to find a JSON code block first (```json ... ``` or ``` ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Try to find a raw JSON object in the text
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  // Return the original text as-is and let JSON.parse handle the error
  return text.trim();
}

/**
 * Attempts a single extraction: sends the prompt, waits for a response,
 * parses the JSON, and validates it.
 */
async function attemptExtraction(
  sendMessage: (text: string) => void,
  waitForResponse: () => Promise<string>
): Promise<ExtractDiagnosisResult> {
  sendMessage(EXTRACTION_PROMPT);

  const responseText = await waitForResponse();

  if (!responseText || responseText.trim().length === 0) {
    return { success: false, error: 'Empty response from session' };
  }

  const jsonStr = extractJsonFromText(responseText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return {
      success: false,
      error: `Failed to parse JSON from response: ${responseText.slice(0, 200)}`,
    };
  }

  try {
    const validated: DiagnoseOutput = validateAndClampDiagnoseOutput(parsed);
    const diagnosis: StructuredDiagnosis = {
      label: validated.label,
      confidence: validated.confidence,
      severity: validated.severity,
      explanationEn: validated.explanationEn,
      explanationTl: validated.explanationTl,
      cautions: validated.cautions,
    };
    return { success: true, diagnosis };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Validation failed: ${message}` };
  }
}

/**
 * Extracts a structured diagnosis from a live Gemini session.
 *
 * The caller provides two callbacks that decouple this function from the
 * session object:
 * - `sendMessage` – sends a text prompt to the session
 * - `waitForResponse` – resolves with the next text response from the session
 *
 * On failure the extraction is retried once (unless `retryOnce` is false).
 */
export async function extractDiagnosis(
  sendMessage: (text: string) => void,
  waitForResponse: () => Promise<string>,
  retryOnce: boolean = true
): Promise<ExtractDiagnosisResult> {
  const first = await attemptExtraction(sendMessage, waitForResponse);
  if (first.success) {
    return first;
  }

  if (!retryOnce) {
    return first;
  }

  // Retry once
  const second = await attemptExtraction(sendMessage, waitForResponse);
  if (second.success) {
    return second;
  }

  return {
    success: false,
    error: `Extraction failed after retry. Last error: ${second.error}`,
  };
}
