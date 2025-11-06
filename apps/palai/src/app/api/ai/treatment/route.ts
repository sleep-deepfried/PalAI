import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { disease, language = 'en' } = await req.json();

    if (!disease) {
      return NextResponse.json(
        { error: 'Disease label is required' },
        { status: 400 }
      );
    }

    // Try n8n first
    const n8nWebhookUrl = process.env.N8N_TREATMENT_WEBHOOK_URL;
    
    if (n8nWebhookUrl) {
      try {
        console.log('Attempting n8n treatment workflow...');
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            disease,
            language,
          }),
        });

        if (n8nResponse.ok) {
          const data = await n8nResponse.json();
          console.log('n8n treatment workflow succeeded');
          return NextResponse.json(data);
        } else {
          console.warn('n8n treatment workflow failed, falling back to Gemini API');
        }
      } catch (n8nError) {
        console.warn('n8n treatment workflow error, falling back to Gemini API:', n8nError);
      }
    } else {
      console.log('N8N_TREATMENT_WEBHOOK_URL not set, using Gemini API directly');
    }

    // Fallback to Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    console.log('Using Gemini API for treatment guide');
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const diseaseNames: Record<string, string> = {
      HEALTHY: 'Healthy Rice',
      BACTERIAL_LEAF_BLIGHT: 'Bacterial Leaf Blight',
      BROWN_SPOT: 'Brown Spot',
      SHEATH_BLIGHT: 'Sheath Blight',
      TUNGRO: 'Tungro Virus',
      BLAST: 'Rice Blast',
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

    return NextResponse.json(json);
  } catch (error: any) {
    console.error('Treatment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate treatment guide' },
      { status: 500 }
    );
  }
}

