# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple weight tracking web application for a small group of trusted friends. It's designed to be minimal and collaborative with session-based authentication (username + password login).

## Technical Stack

- **Backend**: Bun runtime with JavaScript/TypeScript, SQLite database
- **Frontend**: React SPA built with Vite, styled with Tailwind CSS
- **Database**: SQLite with two tables: `Users` and `Weights`
- **Language**: TypeScript
- **Data**: Use Zod to validate external json
- **Errors**: run `bun run typecheck` (tsc -b --noEmit) to validate changes to TypeScript files

## Key Architecture Points

### Access Control

- Session-based authentication with username + password login
- Login via `POST /api/login` sets an HttpOnly session cookie (1 year expiry)
- Logout via `POST /api/logout` clears the session cookie
- All `/api/*` endpoints (except login/logout) require a valid session
- Static assets and the root HTML are served without authentication

### Data Model

- Users table: `id`, `name`, `color`, `password` (SHA-256 hashed)
- Weights table: `id`, `user_id`, `date` (YYYY-MM-DD), `weight_kg`
- Unique constraint on `(user_id, date)`

### UI Structure

- Single table view with users as rows, dates as columns
- Horizontal scrolling with sticky first column (user names)
- Auto-scrolls to rightmost (most recent) date on load
- Responsive design with dark/light mode via `prefers-color-scheme`

### Interactive Features

- Auto-save on blur or 2-second typing delay
- Weekly change indicators (green ↓, red ↑, or –)
- Input validation with shake animation on invalid data

### Date Column Logic

- Generates columns for all Fridays between first entry and current/recent Friday
- Automatically creates empty columns for missing weeks
- Rounds weight inputs to one decimal place

## Development Commands

- `bun run dev` - Start both server and frontend in development mode
- `bun run dev:server` - Start server only with hot reload
- `bun run dev:frontend` - Start frontend only (Vite dev server)
- `bun run build` - Build frontend for production
- `bun run start` - Start production server
- `bun setup-sample-data.ts` - Create sample data for testing

## Environment Variables

- `DATABASE_PATH` - SQLite database file path (default: `./data/tracker.db`)
- `PORT` - Server port (default: 3000)
- `WITHOUT_PASSWORD` - Set to `true` to skip authentication during development (already set in `dev:server` script)

## Development Notes

- Uses Bun's built-in SQLite database (no external dependencies)
- Frontend builds to `./dist` directory
- Users are managed via direct database access (no registration UI)
- Passwords are stored as SHA-256 hashes (manual hashing needed when inserting users)
- Session cookies are HttpOnly with SameSite=Strict (Secure in production)
- Expired sessions are cleaned up automatically every hour
