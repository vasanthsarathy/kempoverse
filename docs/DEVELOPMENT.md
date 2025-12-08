# Development Guide

## Known Issue: Local D1 Database with wrangler pages dev

### Problem

There's currently a limitation with `wrangler pages dev` and local D1 databases where migrations applied via `wrangler d1 migrations apply --local` are stored in a different database instance than the one used by `wrangler pages dev`.

### What Works

- ✅ **Remote database**: All migrations have been successfully applied to the production D1 database
- ✅ **Direct D1 queries**: Using `npm run db:query` works perfectly with the remote database
- ✅ **Production deployment**: When deployed to Cloudflare Pages, everything works as expected

### Workaround for Local Development

**Option 1: Deploy to Cloudflare Pages (Recommended)**

The most reliable way to test is to deploy to Cloudflare Pages:

```bash
npm run build
wrangler pages deploy dist
```

**Option 2: Use Remote Database for Local Testing**

The remote database already has all migrations and seed data. When testing locally, API calls will connect to the remote production database.

Note: `wrangler pages dev` currently uses local D1 databases by default, but there's no reliable way to sync migrations to these isolated instances.

### npm Scripts

- `npm run db:migrate` - Apply migrations to REMOTE database (recommended)
- `npm run db:migrate:local` - Apply migrations to LOCAL database (for wrangler d1 execute only)
- `npm run db:query "SELECT..."` - Query REMOTE database
- `npm run db:query:local "SELECT..."` - Query LOCAL database

### Verification

To verify the remote database has all data:

```bash
npm run db:query "SELECT id, title FROM entries"
```

Expected output: 3 entries (Kempo 6, Short Form 1, The Leopard)

## Development Workflow

1. Make code changes
2. Run `npm run build` to build the frontend
3. Deploy to Cloudflare Pages for testing: `wrangler pages deploy dist`
4. OR wait for the local D1 issue to be resolved in a future wrangler update

## References

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler Pages Dev GitHub Issues](https://github.com/cloudflare/workers-sdk/issues)
