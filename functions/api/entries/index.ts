import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, EntryRow, ApiResponse } from '../../types';
import { rowToEntry, jsonResponse } from '../../types';
import type { Entry } from '../../../src/types';
import { requireAuth } from '../../utils/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    // Query all entries, ordered by updated_at (most recent first)
    const { results } = await DB.prepare(`
      SELECT
        id, title, category, subcategory, belts, tags,
        content_md, reference_urls, created_at, updated_at
      FROM entries
      ORDER BY updated_at DESC
    `).all<EntryRow>();

    // Convert DB rows to Entry objects
    const entries: Entry[] = results.map(rowToEntry);

    return jsonResponse<{ entries: Entry[]; total: number }>({
      data: {
        entries,
        total: entries.length,
      },
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return jsonResponse<null>(
      {
        error: 'Failed to fetch entries',
      },
      500
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Require authentication
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  try {
    const { DB } = context.env;
    const body = await context.request.json() as Partial<Entry>;

    // Validate required fields
    if (!body.title || !body.category || !body.tags || !body.content_md) {
      return jsonResponse<null>(
        { error: 'Missing required fields: title, category, tags, content_md' },
        400
      );
    }

    // Generate new ID and timestamps
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Prepare data for insertion
    const beltsJson = body.belts ? JSON.stringify(body.belts) : null;
    const tagsJson = JSON.stringify(body.tags);
    const referencesJson = body.references && body.references.length > 0
      ? JSON.stringify(body.references)
      : null;

    // Insert into database
    await DB.prepare(`
      INSERT INTO entries (
        id, title, category, subcategory, belts, tags,
        content_md, reference_urls, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title,
      body.category,
      body.subcategory || null,
      beltsJson,
      tagsJson,
      body.content_md,
      referencesJson,
      now,
      now
    ).run();

    // Fetch the created entry
    const result = await DB.prepare(`
      SELECT id, title, category, subcategory, belts, tags,
        content_md, reference_urls, created_at, updated_at
      FROM entries
      WHERE id = ?
    `).bind(id).first<EntryRow>();

    if (!result) {
      return jsonResponse<null>({ error: 'Failed to create entry' }, 500);
    }

    const entry = rowToEntry(result);
    return jsonResponse<Entry>({ data: entry }, 201);
  } catch (error) {
    console.error('Error creating entry:', error);
    return jsonResponse<null>({ error: 'Failed to create entry' }, 500);
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
