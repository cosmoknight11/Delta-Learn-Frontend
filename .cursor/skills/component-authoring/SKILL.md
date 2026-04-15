---
name: component-authoring
description: >-
  Add new React components, pages, and features to the Delta Learn frontend.
  Use when building new UI, adding routes, or extending existing components.
---

# Component & Feature Authoring

## Adding a New Page

1. Create `src/components/PageName.jsx`
2. Add route in `App.jsx` inside `<Routes>`
3. Add styles in `App.css` under a section header: `/* ───── PageName ───── */`
4. If subject-scoped, follow `SubjectPage` pattern: fetch data, set `--accent`, sidebar + content

## ChapterView Structure

```
┌─────────────────────────────────────┐
│ question (h3)                       │
│ difficulty badge    tldr summary     │
│─────────────────────────────────────│
│ answer (HTML)                       │
│ points (bulleted list, HTML items)  │
│ diagram (MermaidDiagram, optional)  │
│ table (headers + rows, optional)    │
│ diagram2 (optional)                 │
│ followup (HTML, optional)           │
│ highlights (auth-only, auto-save)   │
└─────────────────────────────────────┘
```

- Highlights: auto-saved on text selection, Ctrl+Z undoes last highlight
- Extending: add field to backend serializer, render conditionally in ChapterView

## Styling Rules

- No separate CSS files — everything in `App.css`
- Use CSS custom properties, never hardcode hex
- `var(--accent)` adapts per subject
- Dark theme is default and only theme (no toggle)
- Breakpoints: 768px (tablet), 520px (phone)
- Loading: use `<DeltaSpinner text="..." />` (animated triangle)

## API Integration

- All calls via `src/api/client.js` — never use `fetch` directly
- `apiFetch()` auto-attaches JWT, auto-refreshes on 401
- Add new endpoints as exported functions in `client.js`

## Auth Pattern

- Content always public, never block behind auth
- Auth-only: highlights, notes, subscriptions
- Check `useAuth().user`, show "Sign In" prompt for anon (no hard block)

## Key Components

| Component | Purpose |
|-----------|---------|
| DeltaSpinner | Rotating triangle loader, `text` + `small` props |
| NotesDrawer | Side-by-side panel (shifts content, no overlay) |
| AuthModal | Portal to body (avoids stacking context) |
| MermaidDiagram | Client-side Mermaid rendering |
| HighlightPopup | Color picker (yellow/green/blue/pink) |
| Sidebar | Chapter nav, scroll to current, collapsible on mobile |
| UserButton | Auth menu (login/logout/highlights link) |

## Adding API Calls

1. Add exported function in `src/api/client.js` using `apiFetch()`
2. Import in component, call inside `useEffect` or event handler
3. Handle loading with `<DeltaSpinner text="..." />`
4. Handle errors with try/catch, show `window.alert` or inline message

## Environment

- `VITE_API_URL` — backend base (`http://localhost:8000/api` locally, PythonAnywhere URL in production)
- Set in `.env` for local dev, Netlify dashboard for production
