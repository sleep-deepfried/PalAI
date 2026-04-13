import type { NextAuthOptions, Session } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import type { JWT } from 'next-auth/jwt';
import type { Provider } from 'next-auth/providers/index';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { supabaseAdmin, supabase } from '@/lib/supabase';

/**
 * Get the admin client (service role, bypasses RLS) or fall back to anon.
 * Server-side auth operations must bypass RLS to avoid policy recursion.
 */
function getAdminClient() {
  const client = supabaseAdmin || supabase;
  return client as any;
}

/**
 * Minimal NextAuth adapter for Supabase.
 * Only implements the methods required by EmailProvider (verification tokens)
 * and user creation/lookup. Uses JWT strategy so session methods are not needed.
 */
function SupabaseAdapter(): Adapter {
  const client = getAdminClient();

  return {
    async createVerificationToken(verificationToken) {
      const { data, error } = await client
        .from('verification_tokens')
        .insert({
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires.toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create verification token: ${error.message}`);
      return { ...data, expires: new Date(data.expires) };
    },

    async useVerificationToken({ identifier, token }) {
      const { data, error } = await client
        .from('verification_tokens')
        .delete()
        .eq('identifier', identifier)
        .eq('token', token)
        .select()
        .single();

      if (error) return null;
      return { ...data, expires: new Date(data.expires) };
    },

    async createUser(user: Record<string, any>) {
      const { data, error } = await client
        .from('users')
        .insert({
          email: user.email,
          name: user.name || user.email?.split('@')[0] || '',
          image_url: user.image || null,
          is_onboarded: false,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create user: ${error.message}`);
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image_url,
        emailVerified: null,
      };
    },

    async getUser(id) {
      const { data } = await client.from('users').select().eq('id', id).single();
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image_url,
        emailVerified: null,
      };
    },

    async getUserByEmail(email) {
      const { data } = await client.from('users').select().eq('email', email).single();
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image_url,
        emailVerified: null,
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      // Not needed for email+JWT flow, but required by the interface
      return null;
    },

    async updateUser(user) {
      const updateData: Record<string, unknown> = {};
      if (user.name) updateData.name = user.name;
      if (user.image) updateData.image_url = user.image;

      const { data, error } = await client
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update user: ${error.message}`);
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image_url,
        emailVerified: null,
      };
    },

    async linkAccount(account: Record<string, any>) {
      // Account linking handled by email matching in our upsertUser logic
      return undefined as any;
    },

    async createSession() {
      throw new Error('JWT strategy used');
    },
    async getSessionAndUser() {
      throw new Error('JWT strategy used');
    },
    async updateSession() {
      throw new Error('JWT strategy used');
    },
    async deleteSession() {
      throw new Error('JWT strategy used');
    },
  };
}

// Extended types for JWT and Session
interface ExtendedJWT extends JWT {
  userId: string;
  isOnboarded: boolean;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    isOnboarded: boolean;
  };
}

/**
 * Conditionally builds the provider list.
 * Includes Google provider only if both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
 * Logs a warning if Google credentials are missing.
 */
export function getProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    );
  } else {
    console.warn(
      'Google OAuth credentials missing: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. Google provider will be unavailable.'
    );
  }

  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60, // 10 minutes
    })
  );

  return providers;
}

/**
 * Creates or updates a user in Supabase by email.
 * Returns the user's id and onboarding status.
 */
export async function upsertUser(
  email: string,
  name?: string,
  image?: string
): Promise<{ id: string; isOnboarded: boolean }> {
  const client = getAdminClient();

  // Try to find existing user by email
  const { data: existingUser, error: selectError } = await client
    .from('users')
    .select('id, is_onboarded')
    .eq('email', email)
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected for new users
    throw new Error(`Failed to query user: ${selectError.message}`);
  }

  if (existingUser) {
    // Update existing user with latest profile info
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image_url = image;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await client
        .from('users')
        .update(updateData)
        .eq('id', existingUser.id);

      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
    }

    return {
      id: existingUser.id,
      isOnboarded: existingUser.is_onboarded,
    };
  }

  // Create new user
  const { data: newUser, error: insertError } = await client
    .from('users')
    .insert({
      email,
      name: name || email.split('@')[0],
      image_url: image || null,
      is_onboarded: false,
    })
    .select('id, is_onboarded')
    .single();

  if (insertError || !newUser) {
    throw new Error(`Failed to create user: ${insertError?.message || 'Unknown error'}`);
  }

  return {
    id: newUser.id,
    isOnboarded: newUser.is_onboarded,
  };
}

/**
 * Marks a user as onboarded in Supabase.
 */
export async function markUserOnboarded(userId: string): Promise<void> {
  const client = getAdminClient();

  const { error } = await client.from('users').update({ is_onboarded: true }).eq('id', userId);

  if (error) {
    throw new Error(`Failed to mark user as onboarded: ${error.message}`);
  }
}

/**
 * NextAuth configuration options.
 */
export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter(),
  providers: getProviders(),
  pages: {
    signIn: '/auth',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      try {
        await upsertUser(user.email, user.name || undefined, user.image || undefined);
        return true;
      } catch (error) {
        console.error('Failed to upsert user during sign-in:', error);
        return false;
      }
    },

    async jwt({ token, user, profile, account, trigger }) {
      if (user?.email) {
        try {
          const dbUser = await upsertUser(
            user.email,
            user.name || undefined,
            user.image || undefined
          );
          (token as ExtendedJWT).userId = dbUser.id;
          (token as ExtendedJWT).isOnboarded = dbUser.isOnboarded;
        } catch (error) {
          console.error('Failed to fetch user in JWT callback:', error);
        }
      }

      if (trigger === 'update') {
        const ext = token as ExtendedJWT;
        if (ext.userId) {
          try {
            const client = getAdminClient();
            const { data, error } = await client
              .from('users')
              .select('is_onboarded')
              .eq('id', ext.userId)
              .single();
            if (data && !error) {
              ext.isOnboarded = data.is_onboarded;
            }
          } catch (error) {
            console.error('Failed to refresh onboarding flag in JWT:', error);
          }
        }
      }
      // Persist Google profile image from the OAuth profile (most reliable source)
      if (account?.provider === 'google' && profile) {
        const googleProfile = profile as { picture?: string; name?: string };
        if (googleProfile.picture) token.picture = googleProfile.picture;
        if (googleProfile.name) token.name = googleProfile.name;
      } else if (user?.image) {
        token.picture = user.image;
      }
      return token;
    },

    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;
      const extendedSession = session as ExtendedSession;

      if (extendedToken.userId) {
        extendedSession.user.id = extendedToken.userId;
        extendedSession.user.isOnboarded = extendedToken.isOnboarded;
      }
      // Pass image and name from token to session
      if (token.picture) extendedSession.user.image = token.picture as string;
      if (token.name) extendedSession.user.name = token.name as string;

      return extendedSession;
    },

    async redirect({ url, baseUrl }) {
      // Never redirect back to /auth after sign-in — always go home
      if (
        url === `${baseUrl}/auth` ||
        url.startsWith(`${baseUrl}/auth?`) ||
        url === '/auth' ||
        url.startsWith('/auth?')
      ) {
        return `${baseUrl}/`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      return `${baseUrl}/`;
    },
  },
};
