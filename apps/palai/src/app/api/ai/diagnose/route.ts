import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateAndClampDiagnoseOutput } from '@palai/ml';

const SYSTEM_PROMPT = `You are PalAI, an assistant for Filipino rice farmers.

Analyze the rice leaf photo and return STRICT JSON ONLY with keys:
- label: one of [HEALTHY, BACTERIAL_LEAF_BLIGHT, BROWN_SPOT, SHEATH_BLIGHT, TUNGRO, BLAST]
- confidence: number 0..1
- severity: one of [LOW, MODERATE, HIGH]
- explanationEn: short, farmer-friendly English
- explanationTl: Taglish C3 style — very short sentences; simple words; Tagalog base with minimal English agri terms kept; examples:
  - "May signs ng Blast."
  - "I-check ulit after 2–3 days."
  - "Iwasan sobrang basa sa field."
  - "Kung lumalala, mag-consult sa agri technician."
- cautions: array of short strings (e.g., "Blurry image", "Strong glare")

If not a rice leaf or image is unclear, choose the closest label but add a caution telling the user to retake a clearer photo.

Respond with JSON only. No extra text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, locale, fieldNotes } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `${SYSTEM_PROMPT}\n\nLocale: ${locale || 'en'}\n${fieldNotes ? `Field notes: ${fieldNotes}` : ''}`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    });

    const response = await result.response;
    let text = response.text();
    
    // Remove markdown code blocks if present
    if (text.includes('```json')) {
      const match = text.match(/```json\n([\s\S]*?)\n```/);
      text = match ? match[1] : text;
    } else if (text.includes('```')) {
      const match = text.match(/```\n([\s\S]*?)\n```/);
      text = match ? match[1] : text;
    }
    
    const json = JSON.parse(text);
    const validated = validateAndClampDiagnoseOutput(json);

    return NextResponse.json(validated);
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

