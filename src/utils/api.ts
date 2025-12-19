import type {
  Entry,
  ApiResponse,
  EntryListResponse,
  TrainingSession,
} from '../types';

// For local development with Wrangler, use relative path
// Wrangler serves both the frontend and API from the same origin
const API_BASE = '/api';

// Helper to get auth headers
function getAuthHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export interface FetchEntriesParams {
  search?: string;
  category?: string;
  tag?: string;
  belt?: string;
}

export async function fetchEntries(params?: FetchEntriesParams): Promise<Entry[]> {
  const url = new URL(`${API_BASE}/entries`, window.location.origin);

  if (params?.search) {
    url.searchParams.set('q', params.search);
  }
  if (params?.category) {
    url.searchParams.set('category', params.category);
  }
  if (params?.tag) {
    url.searchParams.set('tag', params.tag);
  }
  if (params?.belt) {
    url.searchParams.set('belt', params.belt);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch entries');
  }
  const json: ApiResponse<EntryListResponse> = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json.data?.entries || [];
}

export async function fetchEntry(id: string): Promise<Entry> {
  const response = await fetch(`${API_BASE}/entries/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Entry not found');
    }
    throw new Error('Failed to fetch entry');
  }
  const json: ApiResponse<Entry> = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  if (!json.data) {
    throw new Error('No data returned');
  }
  return json.data;
}

export async function createEntry(
  entry: Omit<Entry, 'id' | 'created_at' | 'updated_at'>,
  token: string
): Promise<Entry> {
  const response = await fetch(`${API_BASE}/entries`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create entry');
  }

  const json: ApiResponse<Entry> = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  if (!json.data) {
    throw new Error('No data returned');
  }
  return json.data;
}

export async function updateEntry(
  id: string,
  updates: Partial<Entry>,
  token: string
): Promise<Entry> {
  const response = await fetch(`${API_BASE}/entries/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update entry');
  }

  const json: ApiResponse<Entry> = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  if (!json.data) {
    throw new Error('No data returned');
  }
  return json.data;
}

export async function deleteEntry(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/entries/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete entry');
  }
}

/**
 * Extract all unique tags from all entries
 * Returns a sorted array of unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const entries = await fetchEntries();
  const tagSet = new Set<string>();

  entries.forEach(entry => {
    entry.tags.forEach(tag => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

/**
 * Upload a single image file to R2 storage
 * Returns the public URL of the uploaded image
 */
export async function uploadImage(
  entryId: string,
  file: File,
  token: string
): Promise<string> {
  const formData = new FormData();
  formData.append('entry_id', entryId);
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/images/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload image');
  }

  const json: ApiResponse<{ url: string }> = await response.json();
  if (json.error || !json.data) {
    throw new Error(json.error || 'No URL returned');
  }

  return json.data.url;
}

// Training API functions

export interface CreateTrainingSessionParams {
  duration_minutes: number;
  categories: string[];
}

export async function createTrainingSession(
  params: CreateTrainingSessionParams,
  token: string
): Promise<TrainingSession> {
  const response = await fetch(`${API_BASE}/training/sessions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create training session');
  }

  const json: ApiResponse<TrainingSession> = await response.json();
  if (json.error || !json.data) {
    throw new Error(json.error || 'Failed to create training session');
  }

  return json.data;
}

export interface FetchTrainingSessionsParams {
  limit?: number;
  offset?: number;
}

export async function fetchTrainingSessions(
  params?: FetchTrainingSessionsParams
): Promise<{ sessions: TrainingSession[]; total: number }> {
  const url = new URL(`${API_BASE}/training/sessions`, window.location.origin);

  if (params?.limit) {
    url.searchParams.set('limit', params.limit.toString());
  }
  if (params?.offset) {
    url.searchParams.set('offset', params.offset.toString());
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch training sessions');
  }

  const json: ApiResponse<{ sessions: TrainingSession[]; total: number }> =
    await response.json();
  if (json.error || !json.data) {
    throw new Error(json.error || 'Failed to fetch training sessions');
  }

  return json.data;
}

export async function fetchTrainingSession(id: string): Promise<TrainingSession> {
  const response = await fetch(`${API_BASE}/training/sessions/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Training session not found');
    }
    throw new Error('Failed to fetch training session');
  }

  const json: ApiResponse<TrainingSession> = await response.json();
  if (json.error || !json.data) {
    throw new Error(json.error || 'Failed to fetch training session');
  }

  return json.data;
}

export async function updateTrainingSession(
  id: string,
  updates: { status: 'completed' | 'abandoned'; completed_at?: string },
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/training/sessions/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update training session');
  }
}

export async function deleteTrainingSession(
  id: string,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/training/sessions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete training session');
  }
}
