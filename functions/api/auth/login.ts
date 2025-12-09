import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../types';
import { jsonResponse } from '../../types';
import { generateToken } from '../../utils/auth';

interface LoginRequest {
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { AUTH_PASSWORD } = context.env;

    // Parse request body
    const body = await context.request.json() as LoginRequest;

    if (!body.password) {
      return jsonResponse<null>(
        {
          error: 'Password is required',
        },
        400
      );
    }

    // Verify password
    if (body.password !== AUTH_PASSWORD) {
      return jsonResponse<null>(
        {
          error: 'Invalid password',
        },
        401
      );
    }

    // Generate token
    const token = await generateToken(context.env);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return jsonResponse<{ token: string; expiresAt: string }>({
      data: {
        token,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse<null>(
      {
        error: 'Login failed',
      },
      500
    );
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
