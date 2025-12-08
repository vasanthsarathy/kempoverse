import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, EntryRow, ApiResponse } from '../../types';
import { rowToEntry, jsonResponse } from '../../types';
import type { Entry } from '../../../src/types';

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
        content_md, reference_urls, created_at, updated_at
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
