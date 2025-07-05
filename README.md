# Weight Tracker

A simple, collaborative weight tracking web application designed for a small group of trusted friends. Features a minimal interface with no user authentication - access is controlled via a shared secret URL parameter.

## Features

- **Collaborative Tracking**: Multiple users can track their weights in a shared table view
- **Simple Interface**: Clean, responsive design with dark/light mode support
- **Weekly Progress**: Visual indicators showing weight changes from previous week
- **Auto-save**: Automatically saves changes after typing stops or field loses focus
- **Data Export**: Export SQLite database for backup or analysis
- **Docker Ready**: Containerized with Caddy reverse proxy for easy deployment

## Tech Stack

- **Backend**: Bun runtime with TypeScript, SQLite database
- **Frontend**: React SPA built with Vite, styled with Tailwind CSS
- **Database**: SQLite with simple schema for users and weights
- **Deployment**: Docker with Caddy reverse proxy

## Quick Start

### Development

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set environment variables:
   ```bash
   export APP_SECRET="your-secret-here"
   export DATABASE_PATH="./data/tracker.db"
   ```

4. Start development server:
   ```bash
   bun run dev
   ```

5. Access the application:
   ```
   http://localhost:3000/?secret=your-secret-here
   ```

### Production with Docker

1. Build the Docker image:
   ```bash
   docker build -t weight-tracker .
   ```

2. Run the container:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e APP_SECRET="your-secret-here" \
     -v $(pwd)/data:/data \
     weight-tracker
   ```

3. Access via: `http://localhost:3000/?secret=your-secret-here`

### Docker Compose

Use the provided `docker-compose.yml` for easy deployment:

```bash
docker-compose up -d
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_SECRET` | Required secret for access control | None (required) |
| `DATABASE_PATH` | SQLite database file path | `./data/tracker.db` |
| `PORT` | Server port | `3000` |

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User display name
- `color` - UI color for user's data

### Weights Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `date` - Date in YYYY-MM-DD format
- `weight_kg` - Weight in kilograms
- Unique constraint on `(user_id, date)`

## API Endpoints

- `GET /api/data` - Get all users, weights, and date columns
- `POST /api/weight` - Add or update a weight entry
- `DELETE /api/weight` - Delete a weight entry
- `GET /api/export/sqlite` - Download SQLite database file

All API endpoints require the secret parameter for authentication.

## Development Commands

```bash
# Start both server and frontend in development
bun run dev

# Start server only with hot reload
bun run dev:server

# Start frontend only (Vite dev server)
bun run dev:frontend

# Build frontend for production
bun run build

# Start production server
bun run start

# Create sample data for testing
bun setup-sample-data.ts
```

## Contributing

This is a personal project designed for a small group. Fork if you'd like to customize for your own use.

## License

Private project - not licensed for public use.
