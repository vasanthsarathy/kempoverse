import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, EntryRow, ApiResponse } from '../../types';
import { rowToEntry, jsonResponse } from '../../types';
import type { Entry } from '../../../src/types';

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

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
