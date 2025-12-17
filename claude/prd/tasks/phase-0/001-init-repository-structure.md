# Task: Initialize Repository Structure

## Task ID
`phase-0/001-init-repository-structure`

## Description
Create the foundational monorepo structure with separate frontend and backend directories, including all necessary configuration files for a modern TypeScript-based full-stack application.

## Prerequisites
- None (this is the first task)

## Expected Outcomes
1. Monorepo structure established with `/frontend` and `/backend` directories
2. Root-level configuration for shared tooling
3. Basic TypeScript configuration in both projects
4. Git properly configured with appropriate ignores

## Deliverables

### Directory Structure
```
/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
├── .nvmrc
├── README.md
└── package.json (root - optional for workspace scripts)
```

### Configuration Files

**Root `.gitignore`** must include:
- `node_modules/`
- `.env` and `.env.*` (except `.env.example`)
- Build outputs (`dist/`, `build/`)
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Log files (`*.log`)

**`.nvmrc`** must specify:
- Node.js LTS version (20.x recommended)

### Package.json Requirements

**Frontend `package.json`:**
- Name: `nba-highlights-frontend`
- Scripts: `dev`, `build`, `preview`, `lint`
- Dependencies: React 18+, React Router, TypeScript

**Backend `package.json`:**
- Name: `nba-highlights-backend`
- Scripts: `dev`, `build`, `start`, `lint`
- Dependencies: Express, TypeScript, ts-node-dev

## Acceptance Criteria
- [ ] Running `npm install` in `/frontend` succeeds
- [ ] Running `npm install` in `/backend` succeeds
- [ ] Running `npm run dev` in `/frontend` starts Vite dev server
- [ ] Running `npm run dev` in `/backend` starts Express server with hot reload
- [ ] TypeScript compilation succeeds in both projects
- [ ] `.gitignore` prevents committing sensitive files

## Technical Notes
- Use Vite for frontend (faster than CRA)
- Use ts-node-dev for backend development (hot reload)
- Prefer ES modules (`"type": "module"`) where possible
- Target Node 20+ for modern JavaScript features

## Estimated Complexity
Low - Standard project scaffolding

## Dependencies
None
