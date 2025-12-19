import type { PagesFunction } from '@cloudflare/workers-types';
import type {
  Env,
  TrainingSessionRow,
  TrainingSessionItemRow,
} from '../../types';
import {
  rowToTrainingSession,
  rowToTrainingSessionItem,
  jsonResponse,
} from '../../types';
import type { Entry, TrainingSession, Category } from '../../../src/types';
import { requireAuth } from '../../utils/auth';
import { rowToEntry, type EntryRow } from '../../types';
import { generateRandomVariation } from '../../utils/variations';

// GET /api/training/sessions
// Fetch all training sessions (newest first)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch sessions
    const { results } = await DB.prepare(
      `SELECT * FROM training_sessions
       ORDER BY started_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all<TrainingSessionRow>();

    const sessions = results.map(rowToTrainingSession);

    // Get total count
    const countResult = await DB.prepare(
      'SELECT COUNT(*) as total FROM training_sessions'
    ).first<{ total: number }>();

    return jsonResponse<{ sessions: TrainingSession[]; total: number }>({
      data: {
        sessions,
        total: countResult?.total || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    return jsonResponse<null>(
      {
        error: 'Failed to fetch training sessions',
      },
      500
    );
  }
};

// POST /api/training/sessions
// Create a new training session with random entries and variations
export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Require authentication
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  try {
    const { DB } = context.env;
    const body = await context.request.json() as {
      duration_minutes: number;
      categories: string[];
    };

    // Validate input
    if (!body.duration_minutes || !body.categories || body.categories.length === 0) {
      return jsonResponse<null>(
        { error: 'Missing required fields: duration_minutes, categories' },
        400
      );
    }

    if (body.duration_minutes < 5 || body.duration_minutes > 120) {
      return jsonResponse<null>(
        { error: 'Duration must be between 5 and 120 minutes' },
        400
      );
    }

    // Calculate number of entries (5 minutes per entry, capped at 4-8)
    const entryCount = Math.max(4, Math.min(8, Math.floor(body.duration_minutes / 5)));

    // Fetch entries matching categories
    const categoryPlaceholders = body.categories.map(() => '?').join(',');
    const { results } = await DB.prepare(
      `SELECT * FROM entries WHERE category IN (${categoryPlaceholders})`
    )
      .bind(...body.categories)
      .all<EntryRow>();

    if (results.length === 0) {
      return jsonResponse<null>(
        { error: 'No entries found matching selected categories' },
        400
      );
    }

    // Shuffle and select random entries
    const shuffled = results.sort(() => Math.random() - 0.5);
    const selectedEntries = shuffled.slice(0, Math.min(entryCount, results.length));

    if (selectedEntries.length < 4) {
      return jsonResponse<null>(
        { error: `Only found ${selectedEntries.length} entries. Need at least 4. Try enabling more categories.` },
        400
      );
    }

    // Calculate time per entry
    const timePerEntry = Math.floor((body.duration_minutes * 60) / selectedEntries.length);

    // Create session
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await DB.prepare(
      `INSERT INTO training_sessions
       (id, duration_minutes, categories, entry_count, started_at, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        sessionId,
        body.duration_minutes,
        JSON.stringify(body.categories),
        selectedEntries.length,
        now,
        'active'
      )
      .run();

    // Create session items with variations
    const items: TrainingSessionItemRow[] = [];
    for (let i = 0; i < selectedEntries.length; i++) {
      const entry = selectedEntries[i];
      const variation = generateRandomVariation();
      const itemId = crypto.randomUUID();

      await DB.prepare(
        `INSERT INTO training_session_items
         (id, session_id, entry_id, entry_title, entry_category,
          time_allocated_seconds, variation_type, variation_text, sequence_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          itemId,
          sessionId,
          entry.id,
          entry.title,
          entry.category,
          timePerEntry,
          variation.type,
          variation.text,
          i
        )
        .run();

      items.push({
        id: itemId,
        session_id: sessionId,
        entry_id: entry.id,
        entry_title: entry.title,
        entry_category: entry.category,
        time_allocated_seconds: timePerEntry,
        variation_type: variation.type,
        variation_text: variation.text,
        sequence_order: i,
        completed_at: null,
      });
    }

    // Return session with items
    const session: TrainingSession = {
      id: sessionId,
      duration_minutes: body.duration_minutes,
      categories: body.categories as Category[],
      entry_count: selectedEntries.length,
      started_at: now,
      status: 'active',
      items: items.map(rowToTrainingSessionItem),
    };

    return jsonResponse<TrainingSession>({ data: session }, 201);
  } catch (error) {
    console.error('Error creating training session:', error);
    return jsonResponse<null>(
      {
        error: 'Failed to create training session',
      },
      500
    );
  }
};
