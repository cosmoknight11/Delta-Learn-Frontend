---
name: component-authoring
description: >-
  Add new React components, pages, and features to the Delta Learn frontend.
  Use when building new UI, adding routes, or extending existing components.
---

# Component & Feature Authoring

## Adding a new page/route

1. Create `src/components/PageName.jsx`
2. Add route in `src/App.jsx` inside `<Routes>`:

```jsx
<Route path="/your-path" element={<PageName />} />
```

3. Add styles in `App.css` under a new section header:

```css
/* ───── PageName ───── */
.page-name { ... }
```

4. If the page is subject-scoped, follow the `SubjectPage` pattern: fetch
   subject data, set `--accent`, render sidebar + content area.

## Adding a feature to ChapterView

ChapterView renders one chapter's questions, diagrams, tables, and takeaways.

### Anatomy of a rendered question:

```
┌─────────────────────────────────────┐
│ question (h3)                       │
│ difficulty badge    tldr summary     │
│─────────────────────────────────────│
│ answer (HTML)                       │
│ points (bulleted list, HTML items)  │
│ diagram (Mermaid, optional)         │
│ table (headers + rows, optional)    │
│ diagram2 (Mermaid, optional)        │
│ followup (HTML, optional)           │
│ highlights bar (auth-only)          │
└─────────────────────────────────────┘
```

### Extending a question section:
1. Backend must expose the new field in `QuestionSerializer`
2. Frontend receives it in `ChapterView` via `chapter.questions[i].newField`
3. Render conditionally: `{q.newField && <div>...</div>}`

## Styling rules

- **Never** hardcode hex colors — always use CSS custom properties
- **Never** create separate CSS files — add to the single `App.css`
- Use semantic section headers in CSS: `/* ───── ComponentName ───── */`
- Dark mode is default; light mode overrides go under `[data-theme="light"]`
- Mobile breakpoints: `768px` (tablet), `520px` (phone)
- Use `var(--accent)` for interactive elements — it auto-adapts per subject

## API integration pattern

```jsx
import { fetchSomething } from '../api/client';

function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSomething().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner" />;
  return <div>{/* render data */}</div>;
}
```

- All API calls go through `src/api/client.js` — never use `fetch` directly
- Add new endpoints as exported functions in `client.js`
- Authenticated endpoints: `apiFetch` auto-attaches JWT; no extra handling

## Auth-gated UI pattern

```jsx
import { useAuth } from '../context/AuthContext';

function FeatureButton() {
  const { user } = useAuth();
  if (!user) return null; // or show "Sign in to use this feature"
  return <button>Feature</button>;
}
```

- Content is always publicly viewable (never block behind auth)
- Auth-only features: highlights, notes, saved progress (future)
- Show a gentle prompt for anonymous users, never a hard block

## Adding a Mermaid diagram

Diagrams are stored as plain Mermaid source strings in the backend.

```
graph LR
  A[Client] --> B[Load Balancer]
  B --> C[Server 1]
  B --> D[Server 2]
```

- Keep diagrams mobile-friendly: max 6 nodes wide
- Use `LR` (left-right) for horizontal flow, `TD` for vertical
- Avoid `classDef` and complex styling — keep diagrams simple
- If a diagram is too large, split into two diagrams (diagram + diagram2)

## DeltaMails Subscription Page

The subscribe page (`SubscribePage.jsx`) allows users to:

- Select subjects to subscribe to
- Choose difficulty level (easy/medium/hard/mixed)
- Add an optional custom prompt (e.g., "focus on caching")
- Submit via `POST /api/deltamails/subscribe/`

API functions are in `src/api/client.js`:

- `subscribeDeltaMails({ email, subjects, difficulty, custom_prompt })`
- `fetchSubscriptions()` — list user's active subscriptions
- `unsubscribeDeltaMails({ email, subject })` — deactivate a subscription
