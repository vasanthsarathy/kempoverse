# Sidebar Navigation Feature

## Goal
Add a sidebar/hamburger menu that shows categories and subcategories, allowing users to quickly browse entries by category/subcategory (e.g., all Kempos).

## Implementation Plan

### Phase 1: Create Sidebar Component
- [ ] Create `src/components/Sidebar.tsx` component
  - Fetches all entries
  - Organizes entries by category → subcategory
  - Shows expandable/collapsible category tree
  - Shows entry count per category/subcategory
  - Clicking an entry navigates to detail page

- [ ] Create `src/components/Sidebar.css` for styling
  - Desktop: Persistent sidebar on left (or collapsible)
  - Mobile: Hamburger menu with slide-out drawer
  - Smooth transitions
  - Category color coding (matching existing badges)

### Phase 2: Update App Layout
- [ ] Update `src/App.tsx` to include Sidebar
  - Add sidebar to main layout
  - Handle mobile hamburger menu state

- [ ] Update `src/App.css` for layout changes
  - Flex/grid layout with sidebar
  - Responsive breakpoints
  - Hamburger menu button styling

### Phase 3: State Management
- [ ] Add sidebar open/closed state
- [ ] Add expanded categories state
- [ ] Handle URL navigation when clicking entries

### Phase 4: Polish & Testing
- [ ] Test on mobile and desktop
- [ ] Ensure accessibility (keyboard navigation, ARIA labels)
- [ ] Smooth animations
- [ ] Update README if needed

## Technical Approach

### Data Structure
Organize entries like this:
```typescript
{
  "technique": {
    "Kempos": [entry1, entry2, ...],
    "Animals": [entry3, entry4, ...],
    "Other": [entry5, ...]
  },
  "form": {
    "Short Forms": [...],
    "Long Forms": [...]
  },
  ...
}
```

### Key Features
1. **Category grouping**: Primary categories (technique, form, self_defense, history, basic)
2. **Subcategory nesting**: Show subcategories under each category
3. **Entry lists**: Quick view of all entries in a subcategory
4. **Direct navigation**: Click entry title → go to detail page
5. **Counts**: Show how many entries in each category/subcategory

### UI Behavior
- **Desktop**: Sidebar always visible on left (or toggle with button)
- **Mobile**: Hamburger menu (☰) that slides out from left
- **Categories**: Click to expand/collapse subcategories
- **Subcategories**: Click to expand/collapse entry list
- **Entries**: Click entry name → navigate to detail page

## Design Notes
- Keep it simple and minimal (following CLAUDE.md principles)
- Reuse existing styles (category colors, badges)
- Should work alongside existing search/filter functionality
- Don't remove existing features, just add navigation option

## Review
(Will be filled in after implementation)
