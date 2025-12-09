import type { Entry, ApiResponse, EntryListResponse } from '../types';

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
