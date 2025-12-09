import type { Env } from '../types';

// Simple token structure: timestamp|signature
// Signature is a simple hash of timestamp + secret
export async function generateToken(env: Env): Promise<string> {
  const timestamp = Date.now();
  const expiresAt = timestamp + 24 * 60 * 60 * 1000; // 24 hours

  // Create a simple signature using Web Crypto API
  const data = `${expiresAt}:${env.AUTH_SECRET}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${expiresAt}:${signature}`;
}

export async function validateToken(token: string, env: Env): Promise<boolean> {
  try {
    const [expiresAtStr, providedSignature] = token.split(':');

    if (!expiresAtStr || !providedSignature) {
      return false;
    }

    const expiresAt = parseInt(expiresAtStr, 10);

    // Check if token is expired
    if (Date.now() > expiresAt) {
      return false;
    }

    // Verify signature
    const data = `${expiresAt}:${env.AUTH_SECRET}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return expectedSignature === providedSignature;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function requireAuth(request: Request, env: Env): Promise<Response | null> {
  const token = getAuthToken(request);

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const isValid = await validateToken(token, env);

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null; // Auth successful
}
