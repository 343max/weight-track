# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple weight tracking web application for a small group of trusted friends. It's designed to be minimal, real-time, and collaborative with no user authentication - access is controlled by a shared secret URL parameter.

## Technical Stack

- **Backend**: Bun runtime with JavaScript/TypeScript, SQLite database
- **Frontend**: React SPA built with Vite, styled with Tailwind CSS
- **Real-time**: WebSocket-based communication for live updates
- **Database**: SQLite with two tables: `Users` and `Weights`
- **Language**: TypeScript

## Key Architecture Points

### Access Control

- Single shared secret via GET parameter: `?secret=value`
- Server validates against `APP_SECRET` environment variable
- No user authentication or session management

### Data Model

- Users table: `id`, `name`, `color`
- Weights table: `id`, `user_id`, `date` (YYYY-MM-DD), `weight_kg`
- Unique constraint on `(user_id, date)`

### UI Structure

- Single table view with users as rows, dates as columns
- Horizontal scrolling with sticky first column (user names)
- Auto-scrolls to rightmost (most recent) date on load
- Responsive design with dark/light mode via `prefers-color-scheme`

### Real-time Features

- WebSocket connection for live data synchronization
- Auto-save on blur or 2-second typing delay
- Weekly change indicators (green ↓, red ↑, or –)
- Input validation with shake animation on invalid data

### Date Column Logic

- Generates columns for all Fridays between first entry and current/recent Friday
- Automatically creates empty columns for missing weeks
- Rounds weight inputs to one decimal place

## Environment Variables

- `APP_SECRET`: Required secret token for access control
- `DATABASE_PATH`: SQLite database file path (e.g., `./data/tracker.db`)

## Development Commands

- `bun run dev` - Start both server and frontend in development mode
- `bun run dev:server` - Start server only with hot reload
- `bun run dev:frontend` - Start frontend only (Vite dev server)
- `bun run build` - Build frontend for production
- `bun run start` - Start production server
- `bun setup-sample-data.ts` - Create sample data for testing

## Environment Variables

- `APP_SECRET` - Required secret token for access control
- `DATABASE_PATH` - SQLite database file path (default: `./data/tracker.db`)
- `PORT` - Server port (default: 3000)

## Development Notes

- Uses Bun's built-in SQLite database (no external dependencies)
- WebSocket server runs on port 8080 for real-time updates
- Frontend builds to `./dist` directory
- Manual user management via direct database access (no UI)
- Prioritizes simplicity over security - designed for trusted users only
- Access via `http://localhost:3000/?secret=your_secret_here`
