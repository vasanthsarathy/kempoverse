# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kempoverse** is a mobile-first karate encyclopedia application for the Dragon-Phoenix karate system. It provides:
- Public read-only access to karate techniques, forms, history, and self-defense moves
- Private editing capabilities (password-protected)
- Fuzzy search by keyword, category, and tags
- Clean, minimalist sumi-style design

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Cloudflare Pages Functions / Workers
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages
- **Search**: Fuse.js (client-side fuzzy search)

## Architecture

**Static SPA + Serverless API**
- Frontend is a static React SPA hosted on Cloudflare Pages
- API endpoints via Cloudflare Pages Functions provide data access
- D1 database stores all entries
- Client-side search for performance (load all entries once, search in-browser)

**Public vs Private**
- Public: Anyone can read all entries via `GET /api/entries`
- Private: Only authenticated users can create/edit/delete via `POST/PUT/DELETE /api/entries`
- Auth via shared password + JWT or Cloudflare Access

## Data Model

Core entity is an **Entry** with the following structure:

```typescript
type Category = "history" | "technique" | "form" | "self_defense" | "basic";

interface Entry {
  id: string;                 // uuid
  title: string;              // e.g. "Kempo 6: Leg Hawk"
  category: Category;
  subcategory?: string;       // e.g. "Kempos", "Animals", "Grabs"
  belts?: string[];           // e.g. ["Green", "Brown 3rd"]
  tags: string[];             // ["haymaker", "club-defense", "takedown"]
  content_md: string;         // Markdown text
  references: string[];       // URLs (YouTube, docs, etc.)
  created_at: string;
  updated_at: string;
}
```

**Database schema** (D1):
```sql
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  belts TEXT,            -- JSON-encoded array
  tags TEXT,             -- JSON-encoded array
  content_md TEXT NOT NULL,
  references TEXT,       -- JSON-encoded array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_entries_category ON entries(category);
CREATE INDEX idx_entries_tags ON entries(tags);
```

## API Endpoints

**Public (no auth):**
- `GET /api/entries` - Returns all entries (client filters/searches)
- `GET /api/entries/:id` - Returns single entry

**Private (auth required):**
- `POST /api/entries` - Create new entry
- `PUT /api/entries/:id` - Update existing entry
- `DELETE /api/entries/:id` - Delete entry

**Auth:**
- `POST /api/login` - Accepts `{ password }`, returns JWT if valid

## Frontend Structure

**Main Routes:**
- `/` - Home page with category tiles
- `/entries` - List view with search/filters
- `/entries/:id` - Entry detail view
- `/new` - Create new entry (auth required)
- `/edit/:id` - Edit entry (auth required)

**Key Components:**
- `App` - Main router and auth context
- `Home` - Category cards grid
- `EntryList` - Search bar + filters + entry cards
- `EntryDetail` - Markdown content + metadata
- `EntryEditor` - Form for create/edit
- `AuthContext` - Login state management

**Search & Filtering:**
- Load all entries on app load
- Use Fuse.js with keys: `["title", "content_md", "tags", "subcategory"]`
- Filter chips for categories and tags
- All search/filtering happens client-side

## Design System

**Sumi-style minimalist aesthetic:**

**Colors:**
- Ink Black: `#050608` (background)
- Paper White: `#F5F2EC` (content cards)
- Deep Red: `#C1121F` (accents, primary actions)
- Muted Gray: `#9CA3AF` (borders, metadata)

**Typography:**
- Font: `IBM Plex Mono` / `JetBrains Mono` / `Space Mono`
- Hierarchy:
  - h1: 24-28px bold (page titles)
  - h2: 18-20px semibold (entry titles)
  - body: 14-16px regular
  - meta: 12-13px uppercase (categories, tags, belts)

**Layout:**
- Mobile-first, single column, max-width 640px
- Padding: 16px mobile, 24px desktop
- Cards: subtle borders, minimal shadows, paper texture overlays

**Branding:**
- App name: `KEMPOVERSE` (uppercase, mono font)
- Tagline: "Your personal universe of kempo knowledge"
- Logo: Simple red circle (●) + text mark

## Development Workflow

**Phase 1 - Setup & Backend Skeleton:**
- Initialize Vite + React + TypeScript
- Create D1 database and run migrations
- Implement basic API endpoints (`GET /api/entries`)
- Seed with sample entries

**Phase 2 - Frontend Browse & Search:**
- Build EntryList and EntryDetail components
- Integrate Fuse.js for fuzzy search
- Connect to API endpoints
- Add category/tag filtering

**Phase 3 - Auth & Editing:**
- Implement login endpoint and JWT handling
- Build EntryEditor form component
- Connect create/update/delete endpoints
- Add auth UI (login button, protected routes)

**Phase 4 - Design Polish:**
- Apply sumi design system
- Mobile testing and optimization
- Micro-interactions and transitions

## Key Principles

**Simplicity First:**
- Keep all changes minimal and focused
- Avoid over-engineering or premature abstractions
- Client-side search is fast enough for hundreds of entries
- No complex backend filtering needed initially

**Mobile-First:**
- Design for phone screens first
- Touch-friendly tap targets (minimum 44px)
- Scrollable forms with sticky save buttons
- Fast load times and instant search

**Minimal & Clean:**
- Sparse UI with lots of whitespace
- Thin borders (1px)
- Subtle animations (150ms max)
- No unnecessary features or fields
