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
- `npm run preview` previews the built app.

This repository is currently scaffolded only. Product behavior, database schema,
chunking, search, and embeddings will be added collaboratively in later steps.

## Repository structure

- `src/renderer` = frontend
- `src/main` = backend
- `src/shared` = data types shared by front & back
- `src/preload` = exposes backend functions to frontend