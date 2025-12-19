import type { PagesFunction } from '@cloudflare/workers-types';
import type {
  Env,
  TrainingSessionRow,
  TrainingSessionItemRow,
} from '../../../types';
import {
  rowToTrainingSession,
  rowToTrainingSessionItem,
  jsonResponse,
} from '../../../types';
import type { TrainingSession } from '../../../../src/types';
import { requireAuth } from '../../../utils/auth';

// GET /api/training/sessions/:id
// Fetch a single training session with all its items
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const sessionId = context.params.id as string;

    // Fetch session
    const sessionRow = await DB.prepare(
      'SELECT * FROM training_sessions WHERE id = ?'
    )
      .bind(sessionId)
      .first<TrainingSessionRow>();

    if (!sessionRow) {
      return jsonResponse<null>({ error: 'Session not found' }, 404);
    }

    // Fetch session items
    const { results: itemRows } = await DB.prepare(
      `SELECT * FROM training_session_items
       WHERE session_id = ?
       ORDER BY sequence_order ASC`
    )
      .bind(sessionId)
      .all<TrainingSessionItemRow>();

    const session = rowToTrainingSession(sessionRow);
    session.items = itemRows.map(rowToTrainingSessionItem);

    return jsonResponse<TrainingSession>({ data: session });
  } catch (error) {
    console.error('Error fetching training session:', error);
    return jsonResponse<null>(
      {
        error: 'Failed to fetch training session',
      },
      500
    );
  }
};

// PUT /api/training/sessions/:id
// Update a training session (e.g., mark as completed or abandoned)
export const onRequestPut: PagesFunction<Env> = async (context) => {
  // Require authentication
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  try {
    const { DB } = context.env;
    const sessionId = context.params.id as string;
    const body = await context.request.json() as {
      status?: 'completed' | 'abandoned';
      completed_at?: string;
    };

    // Validate input
    if (!body.status) {
      return jsonResponse<null>(
        { error: 'Missing required field: status' },
        400
      );
    }

    const completed_at = body.completed_at || new Date().toISOString();

    // Update session
    await DB.prepare(
      `UPDATE training_sessions
       SET status = ?, completed_at = ?
       WHERE id = ?`
    )
      .bind(body.status, completed_at, sessionId)
      .run();

    return jsonResponse<{ success: boolean }>({ data: { success: true } });
  } catch (error) {
    console.error('Error updating training session:', error);
    return jsonResponse<null>(
      {
        error: 'Failed to update training session',
      },
      500
    );
  }
};

// DELETE /api/training/sessions/:id
// Delete a training session
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  // Require authentication
  const authError = await requireAuth(context.request, context.env);
  if (authError) return authError;

  try {
    const { DB } = context.env;
    const sessionId = context.params.id as string;

    // Delete session (cascade deletes items)
    await DB.prepare('DELETE FROM training_sessions WHERE id = ?')
      .bind(sessionId)
      .run();

    return jsonResponse<{ success: boolean }>({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting training session:', error);
    return jsonResponse<null>(
      {
        error: 'Failed to delete training session',
      },
      500
    );
  }
};
