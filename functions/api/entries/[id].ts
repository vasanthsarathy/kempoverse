import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, EntryRow, ApiResponse } from '../../types';
import { rowToEntry, jsonResponse} from '../../types';
import type { Entry } from '../../../src/types';
import { requireAuth } from '../../utils/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params;

    // Validate ID is present
    if (!id || typeof id !== 'string') {
      return jsonResponse<null>(
        {
          error: 'Invalid entry ID',
        },
        400
      );
    }

    // Query single entry by ID
    const result = await DB.prepare(`
      SELECT
        id, title, category, subcategory, belts, tags,
        content_md, reference_urls, video_url, created_at, updated_at
      FROM entries
      WHERE id = ?
    `)
      .bind(id)
      .first<EntryRow>();

    // Entry not found
    if (!result) {
      return jsonResponse<null>(
        {
          error: 'Entry not found',
        },
        404
      );
    }

    // Convert and return
    const entry: Entry = rowToEntry(result);

    return jsonResponse<Entry>({
      data: entry,
    });
  } catch (error) {
    console.error('Error fetching entry:', error);
    return jsonResponse<null>(
      {
        error: 'Failed to fetch entry',
      },
      500
    );
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  // Require authentication
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  try {
    const { DB } = context.env;
    const { id } = context.params;

    if (!id || typeof id !== 'string') {
      return jsonResponse<null>({ error: 'Invalid entry ID' }, 400);
    }

    const body = await context.request.json() as Partial<Entry>;

    // Validate at least one field to update
    if (!body.title && !body.category && !body.tags && !body.content_md &&
        !body.subcategory && !body.belts && !body.references && body.video_url === undefined) {
      return jsonResponse<null>({ error: 'No fields to update' }, 400);
    }

    // Build UPDATE query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (body.title) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.category) {
      updates.push('category = ?');
      values.push(body.category);
    }
    if (body.subcategory !== undefined) {
      updates.push('subcategory = ?');
      values.push(body.subcategory || null);
    }
    if (body.belts !== undefined) {
      updates.push('belts = ?');
      values.push(body.belts ? JSON.stringify(body.belts) : null);
    }
    if (body.tags) {
      updates.push('tags = ?');
      values.push(JSON.stringify(body.tags));
    }
    if (body.content_md) {
      updates.push('content_md = ?');
      values.push(body.content_md);
    }
    if (body.references !== undefined) {
      updates.push('reference_urls = ?');
      values.push(body.references.length > 0 ? JSON.stringify(body.references) : null);
    }
    if (body.video_url !== undefined) {
      updates.push('video_url = ?');
      values.push(body.video_url || null);
    }

    // Always update updated_at
    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);

    // Add ID at the end for WHERE clause
    values.push(id);

    await DB.prepare(`
      UPDATE entries
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    // Fetch and return updated entry
    const result = await DB.prepare(`
      SELECT id, title, category, subcategory, belts, tags,
        content_md, reference_urls, video_url, created_at, updated_at
      FROM entries
      WHERE id = ?
    `).bind(id).first<EntryRow>();

    if (!result) {
      return jsonResponse<null>({ error: 'Entry not found' }, 404);
    }

    const entry = rowToEntry(result);
    return jsonResponse<Entry>({ data: entry });
  } catch (error) {
    console.error('Error updating entry:', error);
    return jsonResponse<null>({ error: 'Failed to update entry' }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  // Require authentication
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  try {
    const { DB } = context.env;
    const { id } = context.params;

    if (!id || typeof id !== 'string') {
      return jsonResponse<null>({ error: 'Invalid entry ID' }, 400);
    }

    // Check if entry exists
    const existing = await DB.prepare(`
      SELECT id FROM entries WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return jsonResponse<null>({ error: 'Entry not found' }, 404);
    }

    // Delete the entry
    await DB.prepare(`
      DELETE FROM entries WHERE id = ?
    `).bind(id).run();

    return jsonResponse<{ message: string }>({
      data: { message: 'Entry deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return jsonResponse<null>({ error: 'Failed to delete entry' }, 500);
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
