# Kempoverse

> Your personal universe of kempo knowledge

A full-stack karate encyclopedia built for the Dragon-Phoenix system, featuring a modern React frontend with Cloudflare Pages Functions backend and D1 database.

## 🎯 Project Overview

Kempoverse is a mobile-first web application for organizing and accessing karate training knowledge. It provides a searchable, categorized database of techniques, forms, self-defense scenarios, and historical information for practitioners of American Kenpo/Kempo karate.

**Live Demo:** https://kempoverse.pages.dev

## ✨ Features

### Current (Phase 1-3a)

- **📚 Content Management**
  - Browse all karate entries in a responsive grid layout
  - View detailed entry pages with markdown-formatted content
  - Category-based organization (techniques, forms, self-defense, history, basics)
  - Tag-based categorization
  - Belt rank indicators

- **🔐 Authentication & CRUD**
  - Token-based authentication (JWT-style)
  - Create, read, update, and delete entries
  - Protected API endpoints for write operations
  - 24-hour token expiration

- **🔍 Database**
  - Full-text search capability (SQLite FTS5)
  - Efficient indexing on categories, tags, and subcategories
  - Automatic timestamp tracking
  - UUID-based entry identification

- **📱 User Experience**
  - Responsive design (mobile-first)
  - Fast page loads with Cloudflare global CDN
  - Clean, modern card-based UI
  - Category-specific color coding
  - Loading and error states

### Coming Soon (Phase 3b-4)

- Login UI and authentication flow
- Entry creation and editing forms
- Search and filtering interface
- Advanced markdown rendering
- Image/video reference support

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server

### Backend
- **Cloudflare Pages Functions** - Serverless API
- **Cloudflare D1** - SQLite database
- **Web Crypto API** - Token signing

### Deployment
- **Cloudflare Pages** - Hosting and CDN
- **Wrangler CLI** - Deployment and local development

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kempoverse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .dev.vars.example .dev.vars
   ```

   Edit `.dev.vars` and set your authentication credentials:
   ```
   AUTH_PASSWORD=your-secure-password
   AUTH_SECRET=your-super-secret-key-min-32-chars
   ```

4. **Initialize the database**
   ```bash
   # Create the D1 database
   npm run db:create

   # Apply migrations
   npm run db:migrate

   # Load seed data (optional)
   npm run db:seed
   ```

5. **Update wrangler.toml**

   After creating the database, copy the `database_id` from the output and update `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "kempoverse-db"
   database_id = "your-database-id-here"
   ```

### Development

#### Local Development

**Option 1: Frontend only (API calls will fail)**
```bash
npm run dev
# Opens http://localhost:5173
```

**Option 2: Full-stack with Wrangler** ⚠️ See known issues below
```bash
npm run build && npm run dev:wrangler
# Opens http://localhost:8788
```

#### Known Issue: Local D1 Development

There's currently a limitation with `wrangler pages dev` where local D1 databases don't sync with migrations properly. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for details.

**Workaround:** Deploy to Cloudflare Pages for testing:
```bash
npm run deploy
```

## 📝 Environment Variables

### Local Development (.dev.vars)

```bash
AUTH_PASSWORD=your-password-here
AUTH_SECRET=your-secret-key-here
```

### Production (Cloudflare Secrets)

Set these in the Cloudflare dashboard or via CLI:

```bash
wrangler secret put AUTH_PASSWORD
wrangler secret put AUTH_SECRET
```

## 🗄 Database Schema

### `entries` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | UUID primary key |
| `title` | TEXT | Entry title (e.g., "Kempo 6: Leg Hawk") |
| `category` | TEXT | Category: technique, form, self_defense, history, basic |
| `subcategory` | TEXT | Optional subcategory (e.g., "Kempos", "Animals") |
| `belts` | TEXT | JSON array of belt ranks (e.g., ["Green", "Brown 3rd"]) |
| `tags` | TEXT | JSON array of tags (e.g., ["haymaker", "takedown"]) |
| `content_md` | TEXT | Markdown-formatted content |
| `reference_urls` | TEXT | JSON array of reference URLs |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

### Indexes

- `idx_entries_category` on `category`
- `idx_entries_tags` on `tags`
- `idx_entries_subcategory` on `subcategory` (where not null)
- Full-text search index on `title` and `content_md`

## 🔌 API Documentation

### Public Endpoints

#### GET /api/entries
Returns all entries, ordered by most recently updated.

**Response:**
```json
{
  "data": {
    "entries": [
      {
        "id": "uuid",
        "title": "Kempo 6: Leg Hawk",
        "category": "technique",
        "subcategory": "Kempos",
        "belts": ["Green", "Brown 3rd"],
        "tags": ["haymaker", "outside-defense", "takedown"],
        "content_md": "# Kempo 6...",
        "references": ["https://..."],
        "created_at": "2025-12-08T00:00:00Z",
        "updated_at": "2025-12-08T00:00:00Z"
      }
    ],
    "total": 3
  }
}
```

#### GET /api/entries/:id
Returns a single entry by ID.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Kempo 6: Leg Hawk",
    // ... full entry data
  }
}
```

### Protected Endpoints

All write operations require authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

#### POST /api/auth/login
Generate an authentication token.

**Request:**
```json
{
  "password": "your-password"
}
```

**Response:**
```json
{
  "data": {
    "token": "timestamp:signature",
    "expiresAt": "2025-12-09T00:00:00Z"
  }
}
```

#### POST /api/entries
Create a new entry.

**Request:**
```json
{
  "title": "New Technique",
  "category": "technique",
  "tags": ["tag1", "tag2"],
  "content_md": "# Description\n\nContent here...",
  "subcategory": "Optional",
  "belts": ["White", "Yellow"],
  "references": ["https://example.com"]
}
```

**Response:** Created entry with 201 status

#### PUT /api/entries/:id
Update an existing entry.

**Request:** Partial entry object with fields to update

**Response:** Updated entry

#### DELETE /api/entries/:id
Delete an entry.

**Response:**
```json
{
  "data": {
    "message": "Entry deleted successfully"
  }
}
```

## 📦 npm Scripts

### Development
- `npm run dev` - Start Vite dev server (frontend only)
- `npm run dev:wrangler` - Start Wrangler pages dev (full-stack)
- `npm run dev:full` - Build + start Wrangler

### Database
- `npm run db:create` - Create D1 database
- `npm run db:migrate` - Apply migrations to remote database
- `npm run db:migrate:local` - Apply migrations locally
- `npm run db:seed` - Load seed data to remote database
- `npm run db:seed:local` - Load seed data locally
- `npm run db:query "SELECT..."` - Run query on remote database
- `npm run db:query:local "SELECT..."` - Run query on local database

### Build & Deploy
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Build and deploy to Cloudflare Pages

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 📁 Project Structure

```
kempoverse/
├── functions/              # Cloudflare Pages Functions (API)
│   ├── api/
│   │   ├── auth/
│   │   │   └── login.ts   # POST /api/auth/login
│   │   └── entries/
│   │       ├── index.ts   # GET/POST /api/entries
│   │       └── [id].ts    # GET/PUT/DELETE /api/entries/:id
│   ├── utils/
│   │   └── auth.ts        # Authentication utilities
│   └── types.ts           # Backend type definitions
├── migrations/            # D1 database migrations
│   ├── 0001_create_entries_table.sql
│   └── seed.sql          # Sample data
├── src/                  # React frontend
│   ├── components/
│   │   ├── EntryList.tsx
│   │   └── EntryDetail.tsx
│   ├── pages/
│   │   └── Home.tsx
│   ├── utils/
│   │   └── api.ts        # API client
│   ├── types/
│   │   └── index.ts      # Frontend types
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── docs/
│   └── DEVELOPMENT.md    # Development notes
├── .dev.vars             # Local environment variables (git-ignored)
├── .dev.vars.example     # Environment template
├── wrangler.toml         # Cloudflare configuration
├── package.json
└── README.md
```

## 🚢 Deployment

### First-Time Setup

1. **Create Cloudflare Pages project**
   ```bash
   npx wrangler pages project create kempoverse --production-branch main
   ```

2. **Create production D1 database**
   ```bash
   npm run db:create
   ```

   Update `wrangler.toml` with the database ID.

3. **Apply migrations to production**
   ```bash
   npm run db:migrate  # Uses --remote by default
   npm run db:seed     # Optional: load sample data
   ```

4. **Set production secrets**
   ```bash
   wrangler secret put AUTH_PASSWORD
   wrangler secret put AUTH_SECRET
   ```

5. **Deploy**
   ```bash
   npm run deploy
   ```

### Subsequent Deployments

```bash
npm run deploy
```

Or configure GitHub Actions for automatic deployments on push.

## 🗺 Roadmap

### ✅ Phase 0: Project Setup (Complete)
- Vite + React + TypeScript
- ESLint, Prettier
- Project structure

### ✅ Phase 1: Backend & API (Complete)
- Cloudflare D1 database setup
- GET /api/entries and /api/entries/:id endpoints
- Full-text search with FTS5
- Migration system
- Sample seed data

### ✅ Phase 2: Frontend UI (Complete)
- React Router navigation
- Entry list and detail pages
- Responsive card layout
- Loading and error states

### ✅ Phase 3a: Authentication & Write Endpoints (Complete)
- Token-based authentication
- POST /api/auth/login
- POST /api/entries (create)
- PUT /api/entries/:id (update)
- DELETE /api/entries/:id (delete)

### 🚧 Phase 3b: Frontend CRUD (In Progress)
- Login page and authentication UI
- Entry creation/editing form
- Protected routes
- Auth state management

### 📋 Phase 4: Enhanced Features (Planned)
- Search interface
- Filter by category, tags, belts
- Advanced markdown rendering
- Image/video embeds
- Export functionality

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by Cloudflare Pages, D1, and Workers
- Designed for the Dragon-Phoenix Karate system

## 📧 Contact

For questions or suggestions, please open an issue in the repository.

---

**Note:** This project is under active development. Features and documentation may change as development progresses.
