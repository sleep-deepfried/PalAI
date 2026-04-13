import { NextRequest, NextResponse } from 'next/server';
import { diagnoseLeafImage } from '@/lib/diagnose-gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, locale, fieldNotes } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const validated = await diagnoseLeafImage({
      imageBase64,
      mimeType,
      locale,
      fieldNotes,
    });

    return NextResponse.json(validated);
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
