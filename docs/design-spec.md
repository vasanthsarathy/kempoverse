You absolutely can keep this very small and still nice to use on your phone.

Below I’ll give you:

1. **Overall architecture & “static vs dynamic”**
2. **Data model** (what an “entry” is)
3. **API & storage design**
4. **Frontend UX flow & components**
5. **Auth & deployment on Cloudflare**
6. **Concrete development plan**
7. **Design system** (sumi style, colors, typography, layout)

I’ll assume you’re comfortable with TypeScript + React, but you can swap in Svelte/Vue if you prefer.

---

## 1. Overall architecture & feasibility

### Requirements recap

* Public read-only encyclopedia of your karate system
* Private editing (only you can add/update/delete)
* Mobile-first, minimal UI
* Entries live under broad categories: **History, Techniques, Forms, Self-defense, Basics**, plus subcategories like *Kempos, Animals, Belts, Grabs* that you’ve already used in the PDF. 
* Text content, links (e.g., YouTube), tags, and fuzzy search by:

  * keyword in title/body
  * category
  * tags

### Static vs dynamic

**Pure static site (no backend)**

* Entries stored in a JSON file in the repo.
* Frontend loads `entries.json` and does all search client-side.
* To edit, you’d change JSON in git (or a CMS-like system that pushes commits).
* Pros: dead simple, free, and blazing fast.
* Cons: can’t edit directly from within the app without some external service.

**Tiny dynamic backend (recommended)**

* Public UI is still a static SPA hosted on **Cloudflare Pages**.
* A small set of **Cloudflare Pages Functions / Workers** provide:

  * `GET /api/entries` + `GET /api/entries/:id`
  * `POST/PUT/DELETE /api/entries` (auth required)
* Data stored in **Cloudflare D1** (SQLite).
* Frontend still does client-side fuzzy search; uses API only to load/save.

Given you explicitly want to *edit from your phone* with a clean UI, I’d choose:

> **Architecture:** Cloudflare Pages (React SPA) + D1 + Pages Functions, with a single-owner password (or Cloudflare Access) protecting write endpoints.

---

## 2. Data model

Single core entity: **Entry**.

### Entry

```ts
type Category =
  | "history"
  | "technique"
  | "form"
  | "self_defense"
  | "basic";

interface Entry {
  id: string;                 // uuid
  title: string;              // e.g. "Kempo 6: Leg Hawk"
  category: Category;
  subcategory?: string;       // e.g. "Kempos", "Animals", "Grabs", "Lineage"
  belts?: string[];           // e.g. ["Green", "Brown 3rd"]
  tags: string[];             // ["haymaker", "club-defense", "takedown"]
  content_md: string;         // Markdown text
  references: string[];       // URLs (YouTube, docs, etc.)
  created_at: string;         // ISO date
  updated_at: string;         // ISO date
}
```

For D1:

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

You can add fields later (e.g., `difficulty`, `requires_partner`, `video_timestamp`).

---

## 3. API & storage design

### REST-ish API

All JSON.

**Public (no auth):**

* `GET /api/entries`

  * Optional query params: `q`, `category`, `tag`
  * For simplicity, return full list and let client filter & fuzzy-search.
* `GET /api/entries/:id`

**Private (auth required):**

* `POST /api/entries`

  * body: `Partial<Entry>` minus `id/created_at/updated_at`
* `PUT /api/entries/:id`

  * body: partial update
* `DELETE /api/entries/:id`

You can start without query filtering on the backend at all; just return everything and handle search in the browser with **Fuse.js** (or your own simple scoring).

### Fuzzy search (client-side)

* Load entries once on app load.
* Use e.g. **Fuse.js** with keys:

  * `["title", "content_md", "tags", "subcategory"]`
* Also filter by:

  * selected category (chip buttons)
  * selected tags

For ~hundreds of entries, this will be instantaneous and keeps backend extremely simple.

---

## 4. Frontend UX & component structure

### Main flows

1. **Browse by category**

   * Home shows five category tiles: History / Techniques / Forms / Self-defense / Basics.
   * Tap → list of entries, filter & search at top.

2. **Search**

   * Persistent search bar at top.
   * Filter chips: category chips (toggle) and tag chips (multi-select).
   * Results list updates as you type.

3. **View entry**

   * Minimal entry page:

     * title
     * belt badges (e.g., White / Yellow)
     * subcategory + tags
     * content rendered as Markdown (including YouTube links)
   * “Edit” button only visible when logged in.

4. **Add / edit entry**

   * Simple form:

     * Title
     * Category (select)
     * Subcategory (free text with suggestions)
     * Belts (multi-select chips)
     * Tags (token input)
     * Content (Markdown textarea)
     * References (list of URL fields)
   * On mobile, this is a scrollable form with a sticky “Save” bar at bottom.

### Component sketch (React)

* `App`

  * `Navbar` / top bar (title + optional login button)
  * `Routes`

    * `/` → `<Home />`
    * `/entries` → `<EntryList />`
    * `/entries/:id` → `<EntryDetail />`
    * `/new` → `<EntryEditor mode="create" />`
    * `/edit/:id` → `<EntryEditor mode="edit" />`
* `Home`

  * Category cards grid + “All entries” link
* `EntryList`

  * `SearchBar`
  * Category chips
  * Tag filter (optional dropdown or horizontal scroll chips)
  * List of `EntryCard`
* `EntryDetail`

  * Title, meta chips, Markdown body
  * References list
* `EntryEditor`

  * Form + save/delete
* `AuthContext`

  * Holds login state + token

Navigation is straightforward, single-page.

---

## 5. Auth & deployment (Cloudflare)

### Simple auth approach

Because this is just you:

**Option A – Shared secret password**

* Have an environment variable `ADMIN_PASSWORD` in Cloudflare.
* `POST /api/login` with `{ password }`:

  * If matches, return a signed JWT with short expiry, signed via Worker secret.
* Frontend stores JWT in `localStorage`.
* All write endpoints require `Authorization: Bearer <token>`.

**Option B – Cloudflare Access**

* Put `/admin` & `/api` write routes behind Cloudflare Access.
* Only allow your email.
* Then frontend just hits APIs; if you’re not signed in via Access you can’t reach them.

Option B is “more Cloudflare-y” but Option A is simpler to implement; both satisfy “public read, private write.”

### Deployment steps

1. Create Cloudflare Pages project (link to GitHub repo).
2. Create D1 DB, run migration.
3. Add Pages Functions for `/api/*`.
4. Configure environment variables / bindings:

   * `DB` → D1 binding
   * `JWT_SECRET` or `ADMIN_PASSWORD`
5. Push to main; Pages auto-builds and deploys.

---

## 6. Development plan (concrete & small)

**Phase 0 – Repo + tooling (0.5 day)**

* Init repo with Vite + React + TS.
* Add ESLint + Prettier.
* Basic `App` with “Hello Dragon-Phoenix”.

**Phase 1 – Data & backend skeleton (1 day)**

* Define SQL schema & migration for `entries`.
* Implement Pages Function handler for:

  * `GET /api/entries`
  * `GET /api/entries/:id`
* Hard-code a couple of seed entries pulled from your PDF (e.g., “Leopard”, “Kempo 6,” “Combo 59”). 

**Phase 2 – Frontend browse & search (1–2 days)**

* Build `EntryList` and `EntryDetail` with mocked data.
* Add real API fetch, global state for `entries`.
* Integrate Fuse.js for fuzzy search.

**Phase 3 – Auth + editing (2 days)**

* Implement `POST /api/login`, JWT, middleware for write routes.
* Implement `POST/PUT/DELETE /api/entries`.
* Build `EntryEditor` form with create/edit flows.

**Phase 4 – Design polish (1–2 days)**

* Apply sumi design system (next section).
* Test on your phone; tweak spacing, tap targets, form usability.
* Optional: add dark-mode variant (but with this palette, regular is already darkish).

So roughly a week of focused evenings, less if you reuse components/styles from other projects.

---

## 7. Design system – sumi, minimal, karate-flavored

### 7.1 Visual language

**Colors** (you can tweak exact hexes later)

* **Ink Black**: `#050608` (background)
* **Paper White**: `#F5F2EC` (content background)
* **Muted Gray**: `#9CA3AF` (borders, metadata text)
* **Deep Red**: `#C1121F` (accents, selected category, primary button)
* **Soft Wash**: use a semi-transparent white overlay with subtle noise for cards.

Usage:

* Background: mostly near-black with paper-like cards.
* Primary accent (red) used sparingly: active chip, main CTA, category markers.
* Lots of whitespace, thin 1px lines.

### 7.2 Typography

* **Primary font:** a clean mono / semi-mono:

  * `"IBM Plex Mono"`, `"JetBrains Mono"`, or `"Space Mono"`, fallback `monospace`.
* Hierarchy:

  * `h1` (24–28px, bold): page titles.
  * `h2` (18–20px, semibold): entry titles.
  * body (14–16px, regular): main content.
  * meta text (12–13px, uppercase, tracking-wide): category, belts, tags.

### 7.3 Layout & components

**General**

* Mobile-first, single column, max width ~640px, centered.
* Padding: `16px` outer padding on mobile, `24px` on larger screens.
* Card style:

  * `border: 1px solid rgba(255,255,255,0.08)`
  * `border-radius: 8px`
  * `background: radial-gradient(circle at top left, rgba(255,255,255,0.03), transparent)`
  * `box-shadow: 0 8px 24px rgba(0,0,0,0.35)` (very subtle)

**Key components**

1. **Top bar**

   * Left: app name, e.g. `龍鳳 Kempo Notes` in small kanji + English.
   * Right: tiny dot indicator if logged in (● red) vs hollow circle for not.

2. **Category tiles**

   * Each category is a horizontal “brush stroke”:

     * Full-width card, black background with a subtle red wash bar on left.
     * Title (e.g., “Techniques”) + line describing what’s inside.
   * Tap → filtered list.

3. **Search bar**

   * Full-width, rounded (pill).
   * Slight paper texture background.
   * Placeholder: “Search kempos, animals, combos…”
   * Icon: simple magnifying glass in red.

4. **Chips (category & tags)**

   * Minimal pill:

     * Border 1px off-white.
     * Text small uppercase.
     * Selected state: red fill, black text.
   * Use for:

     * Category filters
     * Belt tags (White, Yellow, …)
     * Technique tags (haymaker, club, ground, etc.)

5. **EntryCard**

   * Top row: title + small category label.
   * Second row: belts + key tags (up to 3).
   * Bottom row: short excerpt of content.
   * Small vertical red bar on left as accent.

6. **Editor**

   * Background: paper white card on ink black.
   * Section labels in small uppercase mono.
   * Inputs:

     * Simple border-only inputs with subtle focus shadow.
   * “Save” button:

     * Red background, white text, full-width on mobile.
   * “Delete” as text-only red link.

### 7.4 Micro-interactions

* Hover (desktop): very small translateY(-1px) + shadow deepen.
* Tap (mobile): quick 80–100ms opacity flick + scale 0.98–1.
* Animation: fade+slide for page transitions at 150ms; keep it subtle.

---

If you’d like, next step I can:

* Propose concrete **API function code stubs** for Cloudflare (TypeScript Workers), and/or
* Draft the **React component structure** including a minimal `EntryList` + `EntryDetail` with the sumi styles baked into Tailwind or vanilla CSS.

