import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env, EntryRow, ApiResponse } from '../../types';
import { rowToEntry, jsonResponse } from '../../types';
import type { Entry } from '../../../src/types';
import { requireAuth } from '../../utils/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);

    // Get query parameters
    const searchQuery = url.searchParams.get('q') || url.searchParams.get('search');
    const categoryFilter = url.searchParams.get('category');
    const tagFilter = url.searchParams.get('tag');
    const beltFilter = url.searchParams.get('belt');

    let query = '';
    let bindings: any[] = [];

    // If search query is provided, use FTS5
    if (searchQuery) {
      query = `
        SELECT e.id, e.title, e.category, e.subcategory, e.belts, e.tags,
               e.content_md, e.reference_urls, e.video_url, e.image_urls, e.created_at, e.updated_at
        FROM entries e
        INNER JOIN entries_fts fts ON e.id = fts.id
        WHERE entries_fts MATCH ?
        ORDER BY rank
      `;
      bindings.push(searchQuery);
    } else {
      // Regular query without search
      query = `
        SELECT id, title, category, subcategory, belts, tags,
               content_md, reference_urls, video_url, image_urls, created_at, updated_at
        FROM entries
        WHERE 1=1
      `;

      // Add category filter
      if (categoryFilter) {
        query += ' AND category = ?';
        bindings.push(categoryFilter);
      }

      query += ' ORDER BY updated_at DESC';
    }

    const { results } = await DB.prepare(query).bind(...bindings).all<EntryRow>();

    // Convert DB rows to Entry objects and apply client-side filters
    let entries: Entry[] = results.map(rowToEntry);

    // Client-side filtering for tags and belts (since they're JSON arrays)
    if (tagFilter) {
      entries = entries.filter(entry =>
        entry.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))
      );
    }

    if (beltFilter) {
      entries = entries.filter(entry =>
        entry.belts?.some(belt => belt.toLowerCase().includes(beltFilter.toLowerCase()))
      );
    }

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
    const imageUrlsJson = body.image_urls && body.image_urls.length > 0
      ? JSON.stringify(body.image_urls)
      : null;

    // Insert into database
    await DB.prepare(`
      INSERT INTO entries (
        id, title, category, subcategory, belts, tags,
        content_md, reference_urls, video_url, image_urls, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title,
      body.category,
      body.subcategory || null,
      beltsJson,
      tagsJson,
      body.content_md,
      referencesJson,
      body.video_url || null,
      imageUrlsJson,
      now,
      now
    ).run();

    // Fetch the created entry
    const result = await DB.prepare(`
      SELECT id, title, category, subcategory, belts, tags,
        content_md, reference_urls, video_url, image_urls, created_at, updated_at
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
