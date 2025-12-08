// Core data types for Kempoverse
// Based on design-spec.md

export type Category =
  | 'history'
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
