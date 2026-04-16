'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export type PumpChannel = 1 | 2 | 3 | 4;

export interface PumpState {
  pump1On: boolean;
  pump2On: boolean;
  pump3On: boolean;
  pump4On: boolean;
  pump1Label: string;
  pump2Label: string;
  pump3Label: string;
  pump4Label: string;
  updatedAt: string;
}

export interface SinglePumpState {
  isOn: boolean;
  label: string;
}

/**
 * Get the current state of all pumps from Supabase
 */
export async function getAllPumpStates(): Promise<PumpState | null> {
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
    .select(
      'pump_1_on, pump_2_on, pump_3_on, pump_4_on, pump_1_label, pump_2_label, pump_3_label, pump_4_label, updated_at'
    )
    .eq('id', 'default')
    .single();

  if (error || !data) {
    console.error('Failed to get pump states:', error);
    return null;
  }

  return {
    pump1On: data.pump_1_on,
    pump2On: data.pump_2_on,
    pump3On: data.pump_3_on,
    pump4On: data.pump_4_on,
    pump1Label: data.pump_1_label || 'Pump 1',
    pump2Label: data.pump_2_label || 'Pump 2',
    pump3Label: data.pump_3_label || 'Pump 3',
    pump4Label: data.pump_4_label || 'Pump 4',
    updatedAt: data.updated_at,
  };
}

/**
 * Get the state of a specific pump channel
 */
export async function getPumpState(channel: PumpChannel = 1): Promise<SinglePumpState | null> {
  const allStates = await getAllPumpStates();
  if (!allStates) return null;

  switch (channel) {
    case 1:
      return { isOn: allStates.pump1On, label: allStates.pump1Label };
    case 2:
      return { isOn: allStates.pump2On, label: allStates.pump2Label };
    case 3:
      return { isOn: allStates.pump3On, label: allStates.pump3Label };
    case 4:
      return { isOn: allStates.pump4On, label: allStates.pump4Label };
    default:
      return null;
  }
}

/**
 * Toggle a specific pump channel on/off
 */
export async function togglePump(
  turnOn: boolean,
  channel: PumpChannel = 1
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!supabaseAdmin) {
    return { success: false, error: 'Database not available' };
  }

  const columnName = `pump_${channel}_on`;
  const updateData: Record<string, any> = {
    [columnName]: turnOn,
    updated_at: new Date().toISOString(),
  };

  const { error } = await (supabaseAdmin as any)
    .from('iot_pump')
    .update(updateData)
    .eq('id', 'default');

  if (error) {
    console.error(`Failed to toggle pump ${channel}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Toggle multiple pumps at once
 */
export async function toggleMultiplePumps(
  states: Partial<Record<PumpChannel, boolean>>
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!supabaseAdmin) {
    return { success: false, error: 'Database not available' };
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  for (const [channel, state] of Object.entries(states)) {
    if (state !== undefined) {
      updateData[`pump_${channel}_on`] = state;
    }
  }

  const { error } = await (supabaseAdmin as any)
    .from('iot_pump')
    .update(updateData)
    .eq('id', 'default');

  if (error) {
    console.error('Failed to toggle pumps:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Turn off all pumps
 */
export async function turnOffAllPumps(): Promise<{ success: boolean; error?: string }> {
  return toggleMultiplePumps({ 1: false, 2: false, 3: false, 4: false });
}

/**
 * Activate spray for a specified duration (in seconds), then auto-off
 * Uses pump channel 1 by default (Spray Treatment)
 */
export async function activateSpray(
  durationSeconds: number = 30,
  channel: PumpChannel = 1
): Promise<{ success: boolean; error?: string }> {
  const result = await togglePump(true, channel);
  if (!result.success) {
    return result;
  }

  // Note: Auto-off is handled client-side for simplicity
  // In production, you'd want a server-side scheduler or edge function
  return { success: true };
}
