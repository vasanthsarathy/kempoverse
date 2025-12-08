import type { Entry } from '../src/types';

// Cloudflare Pages Functions environment
export interface Env {
  DB: D1Database;
}

// D1 row result (from database, before parsing)
export interface EntryRow {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  belts: string | null; // JSON string
  tags: string; // JSON string
  content_md: string;
  reference_urls: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

// Convert D1 row to Entry type
export function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    title: row.title,
    category: row.category as Entry['category'],
    subcategory: row.subcategory || undefined,
    belts: row.belts ? JSON.parse(row.belts) : undefined,
    tags: JSON.parse(row.tags),
    content_md: row.content_md,
    references: row.reference_urls ? JSON.parse(row.reference_urls) : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Standard API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// CORS headers for all API responses
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Helper to create JSON responses
export function jsonResponse<T>(
  data: ApiResponse<T>,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
