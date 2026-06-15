# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS application with MongoDB/Mongoose integration. Uses pnpm as package manager.

## Commands

- **Install:** `pnpm install`
- **Dev server:** `pnpm run start:dev` (watch mode, port 3000)
- **Build:** `pnpm run build`
- **Lint:** `pnpm run lint` (ESLint with auto-fix)
- **Format:** `pnpm run format` (Prettier)
- **Unit tests:** `pnpm run test` (spec files in `src/`, pattern `*.spec.ts`)
- **Single test:** `pnpm run test -- --testPathPattern=<pattern>`
- **E2E tests:** `pnpm run test:e2e` (spec files in `test/`, pattern `*.e2e-spec.ts`)
- **Test coverage:** `pnpm run test:cov`

## Infrastructure

MongoDB runs via Docker Compose: `docker compose up -d`. Connection string is configured via `MONGO_URL` env var (see `.env.example`).

## Architecture

- **src/main.ts** — Bootstrap entry point, loads env via `dotenv/config`
- **src/app.module.ts** — Root module, wires up Mongoose via async config factory
- **src/config/mongoose.config.ts** — Mongoose connection config, reads `MONGO_URL` from env
- Standard NestJS module structure (controllers, services, modules)

## Code Style

- TypeScript with `nodenext` module resolution, target ES2023
- ESLint + Prettier (flat config in `eslint.config.mjs`)
- `@typescript-eslint/no-explicit-any` is off; floating promises and unsafe arguments are warnings
- Prettier: single quotes, no trailing commas config in `.prettierrc`
