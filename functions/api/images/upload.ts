import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../types';
import { requireAuth } from '../../utils/auth';
import { jsonResponse } from '../../types';

// Allowed image types and max size
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Require authentication
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  try {
    const { IMAGES } = context.env;
    const formData = await context.request.formData();

    const entryId = formData.get('entry_id') as string;
    const file = formData.get('image') as File;

    // Validation
    if (!entryId || !file) {
      return jsonResponse<null>({ error: 'Missing entry_id or image file' }, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonResponse<null>({
        error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`
      }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse<null>({
        error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, 400);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const r2Key = `${entryId}/${fileName}`;

    // Upload to R2
    await IMAGES.put(r2Key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Construct public URL using R2 public access URL
    const publicUrl = `https://pub-af8aa39558164c728c74e68233f7c86a.r2.dev/${r2Key}`;

    return jsonResponse<{ url: string }>({
      data: { url: publicUrl }
    }, 201);

  } catch (error) {
    console.error('Error uploading image:', error);
    return jsonResponse<null>({ error: 'Failed to upload image' }, 500);
  }
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
