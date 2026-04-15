'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { isValidEmail } from '@/lib/validation';

type AuthView = 'initial' | 'otp-verify';

interface AuthPageState {
  view: AuthView;
  email: string;
  otpCode: string;
  error: string | null;
  loading: boolean;
}

export default function AuthPage() {
  const [state, setState] = useState<AuthPageState>({
    view: 'initial',
    email: '',
    otpCode: '',
    error: null,
    loading: false,
  });

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, error: null }));

    if (!isValidEmail(state.email)) {
      setState((prev) => ({
        ...prev,
        error: 'Please enter a valid email address.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const result = await signIn('email', {
        email: state.email,
        redirect: false,
      });

      if (result?.error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to send code. Please try again.',
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          view: 'otp-verify',
          error: null,
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to send code. Please try again.',
      }));
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, error: null, loading: true }));
    try {
      const result = await signIn('email', {
        email: state.email,
        token: state.otpCode,
        redirect: true,
        callbackUrl: '/',
      });
      if (result?.error) {
        const isExpired = result.error.toLowerCase().includes('expired');
        setState((prev) => ({
          ...prev,
          loading: false,
          error: isExpired ? 'Code expired. Request a new one.' : 'Invalid code. Please try again.',
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Invalid code. Please try again.',
      }));
    }
  };

  const handleResendCode = async () => {
    setState((prev) => ({ ...prev, error: null, loading: true, otpCode: '' }));
    try {
      const result = await signIn('email', { email: state.email, redirect: false });
      setState((prev) => ({
        ...prev,
        loading: false,
        error: result?.error ? 'Failed to send code. Please try again.' : null,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to send code. Please try again.',
      }));
    }
  };

  if (state.view === 'otp-verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-ivory">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">Check your email</h1>
          <p className="text-center text-gray-500 mb-8">
            We sent a code to <span className="font-medium text-gray-900">{state.email}</span>
          </p>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp-code" className="block mb-2 text-sm font-medium text-gray-700">
                Verification code
              </label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={state.otpCode}
                onChange={(e) => setState((prev) => ({ ...prev, otpCode: e.target.value }))}
                placeholder="Enter code"
                required
                className="w-full px-4 py-2 border border-ivory-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500"
              />
            </div>
            {state.error && (
              <div className="text-red-600 text-sm" role="alert">
                {state.error}
              </div>
            )}
            <button
              type="submit"
              disabled={state.loading || !state.otpCode}
              className="w-full px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.loading ? 'Verifying...' : 'Verify code'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={state.loading}
              className="text-olive-600 hover:text-olive-700 text-sm font-medium disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() =>
                setState({ view: 'initial', email: '', otpCode: '', error: null, loading: false })
              }
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-ivory">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Welcome to PalAI</h1>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-ivory-300 rounded-lg hover:bg-ivory-200 text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-ivory-300" />
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-ivory-300" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={state.email}
              onChange={(e) =>
                setState((prev) => ({ ...prev, email: e.target.value, error: null }))
              }
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2 border border-ivory-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500"
            />
          </div>
          {state.error && (
            <div className="text-red-600 text-sm" role="alert">
              {state.error}
            </div>
          )}
          <button
            type="submit"
            disabled={state.loading}
            className="w-full px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.loading ? 'Sending code...' : 'Continue with email'}
          </button>
        </form>
      </div>
    </div>
  );
}
