import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { scanId, preventionSteps, treatmentSteps, sources } = await req.json();

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { error } = await (supabaseAdmin as any)
      .from('scans')
      .update({
        prevention_steps: preventionSteps || [],
        treatment_steps: treatmentSteps || [],
        sources: sources || [],
      })
      .eq('id', scanId);

    if (error) {
      console.error('Failed to update scan:', error);
      return NextResponse.json(
        { error: 'Failed to update treatment data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update treatment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

