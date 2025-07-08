# Weight Tracker

A simple, collaborative weight tracking web application designed for a small group of trusted friends. Features a minimal interface with user authentication via username/password and session-based access control.

## Features

- **User Authentication**: Secure login with username/password and session management
- **Collaborative Tracking**: Multiple users can track their weights in a shared table view
- **Simple Interface**: Clean, responsive design with dark/light mode support
- **Weekly Progress**: Visual indicators showing weight changes from previous week
- **Auto-save**: Automatically saves changes after typing stops or field loses focus
- **Password Management**: Built-in password change functionality
- **Data Export**: Export data in CSV, JSON, or SQLite formats
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
   export APP_SECRET="your-secret-here"  # Legacy - can be empty
   export DATABASE_PATH="./data/tracker.db"
   ```

4. Set up user passwords (see Password Management section below)

5. Start development server:
   ```bash
   bun run dev
   ```

6. Access the application:
   ```
   http://localhost:3000
   ```
   
   Login with your username and password.

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

3. Access via: `http://localhost:3000` and login with your credentials

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
- `name` - User display name (case-insensitive login)
- `color` - UI color for user's data
- `password` - Hashed password (SHA-256)

### Weights Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `date` - Date in YYYY-MM-DD format
- `weight_kg` - Weight in kilograms
- Unique constraint on `(user_id, date)`

## API Endpoints

### Public Endpoints
- `POST /api/login` - Authenticate user and create session
- `POST /api/logout` - Destroy current session

### Protected Endpoints (require authentication)
- `GET /api/data` - Get all users, weights, and date columns
- `POST /api/weight` - Add or update a weight entry
- `DELETE /api/weight` - Delete a weight entry
- `POST /api/change-password` - Change current user's password
- `GET /api/export/sqlite` - Download SQLite database file

All protected endpoints require a valid session cookie.

## Password Management

The application includes several scripts for managing user passwords:

### Check Users Without Passwords
```bash
# List users who don't have passwords set
bun run users-without-passwords
# Output: alice,bob,charlie
```

### Generate Passwords for Specific Users
```bash
# Generate 20-character random passwords for specified users
bun run generate-first-passwords "alice,bob,charlie"
# Output:
# username,password
# "alice","Kx7mP9qR3nW2sL8vT1Yb"
# "bob","Zq8vL4tY6sX1nM3pR9wK"
# "charlie","Jh2gF5dS9aQ7eW1xC6vB"
```

### Workflow Examples
```bash
# Get all users without passwords and generate for them
USERS=$(bun run users-without-passwords)
bun run generate-first-passwords "$USERS"

# Save passwords to file
bun run generate-first-passwords "alice,bob" > passwords.csv

# Generate with spaces (automatically trimmed)
bun run generate-first-passwords "alice, bob , charlie"
```

### Notes
- Usernames are case-insensitive for login
- Generated passwords are 20 characters long (letters and numbers)
- Users can change their passwords after logging in via the "Password" tab
- CSV output includes headers for easy spreadsheet import

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

# Password management
bun run users-without-passwords          # List users without passwords
bun run generate-first-passwords "users" # Generate passwords for specific users
```

## Contributing

This is a personal project designed for a small group. Fork if you'd like to customize for your own use.

## License

Private project - not licensed for public use.
