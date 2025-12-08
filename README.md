# Kempoverse

> Your personal universe of kempo knowledge

A mobile-first karate encyclopedia for the Dragon-Phoenix system. Browse techniques, forms, history, and self-defense moves with a clean, minimalist sumi-style interface.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Cloudflare Pages Functions (Phase 1)
- **Database:** Cloudflare D1 (Phase 1)
- **Search:** Fuse.js (client-side fuzzy search)
- **Deployment:** Cloudflare Pages

## Development

### Prerequisites

- Node.js 18+ (currently using v22.20.0)
- npm 9+ (currently using v10.9.3)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check
```

## Project Structure

```
kempoverse/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts (auth, etc.)
│   ├── types/           # TypeScript type definitions
│   ├── styles/          # CSS files
│   ├── utils/           # Utility functions
│   └── assets/          # Static assets
├── public/              # Public static files
├── functions/           # Cloudflare Pages Functions (Phase 1)
├── docs/                # Documentation
│   ├── design-spec.md   # Architecture & design system
│   └── branding.md      # Branding guidelines
└── CLAUDE.md            # Project overview
```

## Design System

### Colors
- **Ink Black:** `#050608` (background)
- **Paper White:** `#F5F2EC` (content)
- **Deep Red:** `#C1121F` (accents)
- **Muted Gray:** `#9CA3AF` (metadata)

### Typography
- **Font:** IBM Plex Mono
- **Mobile-first:** Max-width 640px
- **Minimalist:** Sumi-style aesthetic

## Roadmap

- [x] **Phase 0:** Setup & Tooling
- [ ] **Phase 1:** Backend & API (Cloudflare Pages Functions + D1)
- [ ] **Phase 2:** Frontend Browse & Search (Fuse.js integration)
- [ ] **Phase 3:** Auth & Editing (JWT, forms)
- [ ] **Phase 4:** Design Polish (mobile optimization)

## License

Private project - All rights reserved
