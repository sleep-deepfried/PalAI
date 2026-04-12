import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GoogleGenAI, Modality } from '@google/genai';
import { authOptions } from '@/lib/auth';

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const client = new GoogleGenAI({ apiKey });

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
          },
        },
        // Ephemeral token + Live API are v1alpha-only; default SDK version fails token create.
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });

    return NextResponse.json({ token: token.name });
  } catch (error) {
    console.error('Failed to create ephemeral token:', error);
    return NextResponse.json({ error: 'Failed to create ephemeral token' }, { status: 500 });
  }
}
