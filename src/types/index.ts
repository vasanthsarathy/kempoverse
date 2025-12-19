// Core data types for Kempoverse
// Based on design-spec.md

export type Category =
  | 'knowledge'
  | 'technique'
  | 'form'
  | 'self_defense'
  | 'basic';

export interface Entry {
  id: string; // uuid
  title: string; // e.g. "Kempo 6: Leg Hawk"
  category: Category;
  subcategory?: string; // e.g. "Kempos", "Animals", "Grabs"
  belts?: string[]; // e.g. ["Green", "Brown 3rd"]
  tags: string[]; // ["haymaker", "club-defense", "takedown"]
  content_md: string; // Markdown text
  references: string[]; // URLs (YouTube, docs, etc.)
  video_url?: string; // YouTube video URL
  image_urls?: string[]; // Image URLs from R2 storage
  created_at: string; // ISO date
  updated_at: string; // ISO date
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface EntryListResponse {
  entries: Entry[];
  total: number;
}

// Auth types
export interface AuthState {
  isAuthenticated: boolean;
  token?: string;
}

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
}

// Training types
export type VariationType = 'stance' | 'speed' | 'focus' | 'repetition';

export interface TrainingSession {
  id: string;
  duration_minutes: number;
  categories: Category[];
  entry_count: number;
  started_at: string;
  completed_at?: string;
  status: 'active' | 'completed' | 'abandoned';
  items?: TrainingSessionItem[];
}

export interface TrainingSessionItem {
  id: string;
  session_id: string;
  entry_id: string;
  entry_title: string;
  entry_category: Category;
  time_allocated_seconds: number;
  variation_type?: VariationType;
  variation_text?: string;
  sequence_order: number;
  completed_at?: string;
}
