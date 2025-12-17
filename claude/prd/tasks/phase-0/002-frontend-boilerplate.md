# Task: Set Up Frontend Boilerplate

## Task ID
`phase-0/002-frontend-boilerplate`

## Description
Initialize the React frontend application with Vite, configure essential dependencies, and establish the basic application shell with routing.

## Prerequisites
- `phase-0/001-init-repository-structure` completed

## Expected Outcomes
1. Vite + React + TypeScript project fully configured
2. React Router installed and basic routes defined
3. Tailwind CSS configured for styling
4. Basic application shell with layout component
5. API client module stubbed for backend communication

## Deliverables

### Dependencies to Install
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "@vitejs/plugin-react": "^4.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "tailwindcss": "^3.x",
    "typescript": "^5.x",
    "vite": "^5.x"
  }
}
```

### File Structure
```
frontend/src/
├── main.tsx                 # App entry point
├── App.tsx                  # Root component with router
├── index.css                # Global styles + Tailwind imports
├── components/
│   └── Layout.tsx           # Shared layout (header, main, footer)
├── pages/
│   ├── HomePage.tsx         # Landing page (stub)
│   ├── TeamPage.tsx         # Team detail page (stub)
│   └── DatePage.tsx         # Date browser page (stub)
├── api/
│   └── client.ts            # API client configuration
└── types/
    └── index.ts             # Shared TypeScript types
```

### Route Configuration
| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Landing page with navigation options |
| `/team/:abbreviation` | `TeamPage` | Team's recent games |
| `/date/:date` | `DatePage` | All games on a specific date |

### Tailwind Configuration
- Configure with NBA-appropriate color palette
- Enable dark mode support (class-based)
- Set up custom spacing/sizing if needed

### API Client Stub
```typescript
// api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }
};
```

## Acceptance Criteria
- [ ] `npm run dev` starts application on localhost:5173
- [ ] Navigating to `/`, `/team/lal`, `/date/2024-12-14` renders correct page stubs
- [ ] Tailwind classes apply correctly
- [ ] No TypeScript errors
- [ ] Layout component renders on all pages
- [ ] API client module exports correctly (even if backend not running)

## Technical Notes
- Use React Router v6 with `createBrowserRouter` for type-safe routing
- Page components should be minimal stubs (just title + "Coming soon")
- Layout should include placeholder header with app name
- Environment variable `VITE_API_URL` for API base URL

## Estimated Complexity
Low-Medium - Standard React setup with routing

## Dependencies
- Task `001-init-repository-structure`
