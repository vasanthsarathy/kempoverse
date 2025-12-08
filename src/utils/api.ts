import type { Entry, ApiResponse, EntryListResponse } from '../types';

// For local development with Wrangler, use relative path
// Wrangler serves both the frontend and API from the same origin
const API_BASE = '/api';

export async function fetchEntries(): Promise<Entry[]> {
  const response = await fetch(`${API_BASE}/entries`);
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
