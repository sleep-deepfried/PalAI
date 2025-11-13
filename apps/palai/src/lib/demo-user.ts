import { supabaseAdmin } from '@/lib/supabase';

const DEMO_EMAIL = 'demo@palai.local';

export async function getDemoUserId(): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized. Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  }

  // Check if demo user exists
  const { data: existingUser } = await (supabaseAdmin as any)
    .from('users')
    .select('id')
    .eq('email', DEMO_EMAIL)
    .single();

  if (existingUser) {
    return existingUser.id;
  }

  // Create demo user if it doesn't exist
  const { data: newUser, error } = await (supabaseAdmin as any)
    .from('users')
    .insert({
      email: DEMO_EMAIL,
      name: 'Demo User',
      role: 'FARMER',
    })
    .select('id')
    .single();

  if (error || !newUser) {
    throw new Error(`Failed to get demo user: ${error?.message || 'Unknown error'}`);
  }

  return newUser.id;
}

