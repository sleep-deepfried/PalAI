import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { disease, language = 'en' } = await req.json();

    if (!disease) {
      return NextResponse.json({ error: 'Disease label is required' }, { status: 400 });
    }

    // Use Gemini API for treatment guide
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    console.log('Using Gemini API for treatment guide');
    const modelName = process.env.GEMINI_TREATMENT_MODEL || 'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);

    const stepSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        step: { type: SchemaType.NUMBER },
        titleEn: { type: SchemaType.STRING },
        titleTl: { type: SchemaType.STRING },
        descriptionEn: { type: SchemaType.STRING },
        descriptionTl: { type: SchemaType.STRING },
      },
      required: ['step', 'titleEn', 'titleTl', 'descriptionEn', 'descriptionTl'],
    };

    const sourceSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        url: { type: SchemaType.STRING },
      },
      required: ['title', 'url'],
    };

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            preventionSteps: {
              type: SchemaType.ARRAY,
              items: stepSchema,
            },
            treatmentSteps: {
              type: SchemaType.ARRAY,
              items: stepSchema,
            },
            sources: {
              type: SchemaType.ARRAY,
              items: sourceSchema,
            },
          },
          required: ['preventionSteps', 'treatmentSteps', 'sources'],
        },
      },
    });

    const diseaseNames: Record<string, string> = {
      HEALTHY: 'Healthy Rice',
      SHEATH_BLIGHT: 'Sheath Blight',
      TUNGRO: 'Tungro Virus',
      RICE_BLAST: 'Rice Blast',
    };

    const diseaseName = diseaseNames[disease] || disease;

    const prompt = `You are an agricultural expert specializing in rice disease management in the Philippines.

Disease: ${diseaseName}

Provide comprehensive treatment and prevention guidance in both English and Tagalog (Filipino language).

Return ONLY a valid JSON object with this EXACT structure (no markdown, no code blocks):
{
  "preventionSteps": [
    {
      "step": 1,
      "titleEn": "Short prevention step title in English",
      "titleTl": "Short prevention step title in Tagalog",
      "descriptionEn": "Detailed prevention description in English",
      "descriptionTl": "Detailed prevention description in Tagalog"
    }
  ],
  "treatmentSteps": [
    {
      "step": 1,
      "titleEn": "Short treatment step title in English",
      "titleTl": "Short treatment step title in Tagalog",
      "descriptionEn": "Detailed treatment description in English",
      "descriptionTl": "Detailed treatment description in Tagalog"
    }
  ],
  "sources": [
    {
      "title": "Source name",
      "url": "https://example.com"
    }
  ]
}

Requirements:
- Provide 3-5 prevention steps
- Provide 3-5 treatment steps
- Include credible sources (IRRI, PhilRice, university research)
- Use practical, actionable advice for Filipino farmers
- Tagalog translations should be natural and commonly used terms
- Steps should be numbered sequentially
- Include specific product names or chemicals when relevant
${disease === 'HEALTHY' ? '- For healthy plants, focus only on prevention/maintenance, no treatment needed' : ''}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const json = JSON.parse(response.text());

    return NextResponse.json(json);
  } catch (error: any) {
    console.error('Treatment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate treatment guide' },
      { status: 500 }
    );
  }
}
