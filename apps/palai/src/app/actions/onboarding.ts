'use server';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, markUserOnboarded } from '@/lib/auth';

/**
 * Server action to mark the current user as onboarded and redirect to homepage.
 * Called when the user completes or skips the onboarding tour.
 */
export async function completeOnboarding(): Promise<void> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect('/auth');
  }

  await markUserOnboarded(userId);
  redirect('/?tour=1');
}
