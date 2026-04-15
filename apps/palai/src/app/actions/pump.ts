'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export interface PumpState {
  isOn: boolean;
  updatedAt: string;
}

/**
 * Get the current pump state from Supabase
 */
export async function getPumpState(): Promise<PumpState | null> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  if (!supabaseAdmin) {
    console.error('Supabase admin client not available');
    return null;
  }

  const { data, error } = await (supabaseAdmin as any)
    .from('iot_pump')
    .select('pump_is_on, updated_at')
    .eq('id', 'default')
    .single();

  if (error || !data) {
    console.error('Failed to get pump state:', error);
    return null;
  }

  return {
    isOn: data.pump_is_on,
    updatedAt: data.updated_at,
  };
}

/**
 * Toggle the pump on/off
 */
export async function togglePump(turnOn: boolean): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!supabaseAdmin) {
    return { success: false, error: 'Database not available' };
  }

  const { error } = await (supabaseAdmin as any)
    .from('iot_pump')
    .update({
      pump_is_on: turnOn,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'default');

  if (error) {
    console.error('Failed to toggle pump:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Activate spray for a specified duration (in seconds), then auto-off
 */
export async function activateSpray(
  durationSeconds: number = 30
): Promise<{ success: boolean; error?: string }> {
  const result = await togglePump(true);
  if (!result.success) {
    return result;
  }

  // Note: Auto-off is handled client-side for simplicity
  // In production, you'd want a server-side scheduler or edge function
  return { success: true };
}
