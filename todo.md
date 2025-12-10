# Todo: Rename "history" category to "knowledge"

## Goal
Rename the "history" category to "knowledge" to better capture subcategories like "history", "rules", "anatomy", etc.

## Implementation Plan

### Files to Update
- [ ] src/types/index.ts - Update Category type definition from 'history' to 'knowledge'
- [ ] src/components/Sidebar.tsx - Update CATEGORY_LABELS and CATEGORY_ORDER
- [ ] src/components/EntryForm.tsx - Update category dropdown option
- [ ] src/pages/Home.tsx - Update category filter dropdown option
- [ ] CLAUDE.md - Update documentation to reflect new category name

## Notes

- Backend stores categories as plain strings, so no database migration needed
- Existing entries with category="history" will still work (they'll just display as "Knowledge")
- The display label will change from "History" to "Knowledge"
- The category value in the type will change from 'history' to 'knowledge'

## Review

### ✅ Changes Complete

Successfully renamed the "history" category to "knowledge" to better capture subcategories like history, rules, anatomy, etc.

**Files Modified:**
1. `src/types/index.ts` - Changed Category type from 'history' to 'knowledge'
2. `src/components/Sidebar.tsx` - Updated CATEGORY_LABELS ('History' → 'Knowledge') and CATEGORY_ORDER
3. `src/components/EntryForm.tsx` - Updated category dropdown option
4. `src/pages/Home.tsx` - Updated category filter dropdown option
5. `CLAUDE.md` - Updated documentation to reflect new category name

**Impact:**
- All UI dropdowns and labels now show "Knowledge" instead of "History"
- Type system enforces 'knowledge' as the valid category value
- No database migration needed (categories stored as strings)
- Existing entries with category="history" will need to be updated in the database to category="knowledge"
