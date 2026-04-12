import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { validateAndClampDiagnoseOutput } from '@palai/ml';

const SYSTEM_PROMPT = `You are PalAI, an assistant for Filipino rice farmers.

Analyze the rice leaf photo and return STRICT JSON ONLY with keys:
- label: one of [HEALTHY, SHEATH_BLIGHT, TUNGRO, RICE_BLAST]
- confidence: number 0..1
- severity: one of [LOW, MODERATE, HIGH]
- explanationEn: short, farmer-friendly English
- explanationTl: Taglish C3 style — very short sentences; simple words; Tagalog base with minimal English agri terms kept; examples:
  - "May signs ng Blast."
  - "I-check ulit after 2–3 days."
  - "Iwasan sobrang basa sa field."
  - "Kung lumalala, mag-consult sa agri technician."
- cautions: array of short strings (e.g., "Blurry image", "Strong glare")

Label choice — use ONLY what is visible; do not guess field or weather:
- RICE_BLAST (fungal): look for spindle- or diamond-shaped dead/necrotic spots on the leaf blade, often with a narrow brown border and lighter/ash center; lesions are discrete patches, not uniform yellowing of the whole leaf.
- TUNGRO (viral): look for orange-yellow, yellow-green, or rusty mottling/streaking, often along veins or uneven patches without clear spindle-shaped blast lesions; stunted or twisted leaves in the frame favor Tungro. Do NOT label TUNGRO for generic uniform yellowing if spindle blast lesions are visible—choose RICE_BLAST.
- SHEATH_BLIGHT: gray-green irregular water-soaked areas, often toward leaf base/sheath region; if the photo is mostly upper leaf with classic spindle blast spots, prefer RICE_BLAST.
- HEALTHY: no credible disease signs.

If Tungro vs blast is ambiguous (poor focus, one leaf only, mixed lighting), pick the slightly better match, cap confidence at 0.55, and add a caution to retake a sharp photo showing the full leaf surface.

If not a rice leaf or image is unclear, choose the closest label but add a caution telling the user to retake a clearer photo.

Respond with JSON only. No extra text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, locale, fieldNotes } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const modelName = process.env.GEMINI_DIAGNOSE_MODEL || 'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        // Lower than default so similar-looking Tungro vs blast picks stay stable across runs
        temperature: 0.25,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            label: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['HEALTHY', 'SHEATH_BLIGHT', 'TUNGRO', 'RICE_BLAST'],
            },
            confidence: { type: SchemaType.NUMBER },
            severity: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['LOW', 'MODERATE', 'HIGH'],
            },
            explanationEn: { type: SchemaType.STRING },
            explanationTl: { type: SchemaType.STRING },
            cautions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: [
            'label',
            'confidence',
            'severity',
            'explanationEn',
            'explanationTl',
            'cautions',
          ],
        },
      },
    });

    const prompt = `${SYSTEM_PROMPT}\n\nLocale: ${locale || 'en'}\n${fieldNotes ? `Field notes: ${fieldNotes}` : ''}`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
          ],
        },
      ],
    });

    const response = result.response;
    const json = JSON.parse(response.text());
    const validated = validateAndClampDiagnoseOutput(json);

    return NextResponse.json(validated);
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
