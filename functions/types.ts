import type { Entry, TrainingSession, TrainingSessionItem } from '../src/types';

// Cloudflare Pages Functions environment
export interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
  AUTH_PASSWORD: string;
  IMAGES: R2Bucket;
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
  video_url: string | null;
  image_urls: string | null; // JSON string
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
    video_url: row.video_url || undefined,
    image_urls: row.image_urls ? JSON.parse(row.image_urls) : undefined,
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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

// Training session row (from database, before parsing)
export interface TrainingSessionRow {
  id: string;
  duration_minutes: number;
  categories: string; // JSON string
  entry_count: number;
  started_at: string;
  completed_at: string | null;
  status: string;
}

// Training session item row (from database, before parsing)
export interface TrainingSessionItemRow {
  id: string;
  session_id: string;
  entry_id: string;
  entry_title: string;
  entry_category: string;
  time_allocated_seconds: number;
  variation_type: string | null;
  variation_text: string | null;
  sequence_order: number;
  completed_at: string | null;
}

// Convert database row to TrainingSession
export function rowToTrainingSession(row: TrainingSessionRow): TrainingSession {
  return {
    id: row.id,
    duration_minutes: row.duration_minutes,
    categories: JSON.parse(row.categories),
    entry_count: row.entry_count,
    started_at: row.started_at,
    completed_at: row.completed_at || undefined,
    status: row.status as TrainingSession['status'],
  };
}

// Convert database row to TrainingSessionItem
export function rowToTrainingSessionItem(row: TrainingSessionItemRow): TrainingSessionItem {
  return {
    id: row.id,
    session_id: row.session_id,
    entry_id: row.entry_id,
    entry_title: row.entry_title,
    entry_category: row.entry_category as TrainingSessionItem['entry_category'],
    time_allocated_seconds: row.time_allocated_seconds,
    variation_type: row.variation_type as TrainingSessionItem['variation_type'],
    variation_text: row.variation_text || undefined,
    sequence_order: row.sequence_order,
    completed_at: row.completed_at || undefined,
  };
}
