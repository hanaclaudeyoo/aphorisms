# Aphorisms

A local-first desktop note-taking app for short personal insights.

## Stack

- Desktop shell: Electron
- Frontend: React + TypeScript
- Backend/runtime: Electron main process in TypeScript
- Database: SQLite
- Vector extension: sqlite-vec
- Full-text search: SQLite FTS5
- Embeddings: Ollama embeddings API

## Scripts

- `npm run dev` starts the Electron app in development mode.
- `npm run build` typechecks and builds the Electron app.
- `npm run db:init` initializes a local development SQLite database at `.local/aphorisms.sqlite3`.
- `npm run preview` previews the built app.

## Repository structure

- `src/renderer` = frontend
- `src/main` = backend
- `src/main/db/schema.ts` = SQLite schema
- `src/main/db/database.ts` = SQLite connection and initialization
- `src/main/db/repositories` = database read/write functionsintegration
- `src/shared` = data types shared by front & back
- `src/preload` = exposes backend functions to frontend
