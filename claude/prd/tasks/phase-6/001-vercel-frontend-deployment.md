# Task: Deploy Frontend to Vercel

## Task ID
`phase-6/001-vercel-frontend-deployment`

## Description
Configure and deploy the React frontend application to Vercel with automatic deployments from the main branch.

## Prerequisites
- `phase-5/006-user-preferences` completed
- Vercel account created
- GitHub repository configured

## Expected Outcomes
1. Frontend deployed to Vercel
2. Automatic deployments on push to main
3. Preview deployments for pull requests
4. Environment variables configured
5. Custom domain configured (optional)

## Deliverables

### Vercel Configuration
```json
// frontend/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Environment Variables for Vercel

**Production Environment:**
```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

**Preview Environment:**
```
VITE_API_URL=https://your-backend-preview-url.vercel.app/api
```

### Deployment Steps

1. **Connect Repository to Vercel**
   ```bash
   # Install Vercel CLI (if not already installed)
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Link project (from frontend directory)
   cd frontend
   vercel link
   ```

2. **Configure Project Settings**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_URL` for Production and Preview

4. **Deploy**
   ```bash
   # Deploy to preview
   vercel

   # Deploy to production
   vercel --prod
   ```

### Build Optimization

**Update vite.config.ts:**
```typescript
// frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Generate source maps for production debugging
    sourcemap: true,

    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },

    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
  },

  // Define env prefix
  envPrefix: 'VITE_',
});
```

### Pre-deployment Checklist

**`frontend/scripts/pre-deploy.sh`:**
```bash
#!/bin/bash

echo "Running pre-deployment checks..."

# Type check
echo "→ Type checking..."
npm run typecheck || exit 1

# Lint
echo "→ Linting..."
npm run lint || exit 1

# Build
echo "→ Building..."
npm run build || exit 1

echo "✅ All checks passed!"
```

**Add npm scripts:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "predeploy": "./scripts/pre-deploy.sh"
  }
}
```

### GitHub Actions (Optional)
```yaml
# .github/workflows/frontend-deploy.yml

name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Type check
        working-directory: frontend
        run: npm run typecheck

      - name: Lint
        working-directory: frontend
        run: npm run lint

      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          vercel-args: '--prod'
```

### Post-Deployment Verification

After deployment, verify:
1. Home page loads correctly
2. Team pages accessible (e.g., `/team/lal`)
3. Date pages accessible (e.g., `/date/2024-12-14`)
4. API calls succeed (check Network tab)
5. 404 page works for invalid routes
6. Mobile responsive design works

## Acceptance Criteria
- [ ] Frontend accessible at Vercel URL
- [ ] All pages load without errors
- [ ] API requests reach backend
- [ ] Client-side routing works (no 404 on refresh)
- [ ] Assets cached with proper headers
- [ ] Build succeeds without type errors
- [ ] Preview deployments work for PRs
- [ ] HTTPS enabled

## Technical Notes
- Vercel auto-detects Vite projects
- SPA rewrites needed for client-side routing
- Environment variables must start with `VITE_`
- Source maps enable production debugging

## Estimated Complexity
Low-Medium - Standard Vercel deployment

## Dependencies
- Task `phase-5/006-user-preferences`
- Vercel account (user provides)

## External Requirements
User must provide:
- Vercel account access
- (Optional) Custom domain DNS access
