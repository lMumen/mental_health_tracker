# Mental Health Tracker

A full-stack wellbeing tracking application built with React, Express, SQLite, Google OAuth, and Socket.IO. Users can record a daily check-in, review their history, edit today's entry, and explore weekly, monthly, or three-month trends.

## Main features

- Google authentication
- One check-in per user and date
- Editing restricted to today's check-in
- Three-step daily wellbeing questionnaire
- Mood, anxiety, stress, sleep, social engagement, physical activity, and symptom tracking
- Paginated history with 10 entries per page
- Weekly, monthly, and three-month charts
- Real-time updates with Socket.IO
- Optional prepared 90-day sample dataset
- Responsive and accessible interface

## Technology

- Frontend: React 19, Vite, Tailwind CSS, Recharts, Socket.IO Client
- Backend: Node.js, Express, Zod, Socket.IO
- Authentication: Google Identity Services and JWT
- Database: SQLite
- Monorepo: npm workspaces

## Requirements

Install the following before starting:

- Node.js 22 or newer
- npm

The repository includes an [.nvmrc](./.nvmrc) file for Node 22.

## 1. Clone and enter the project

```bash
git clone <repository-url>
cd mental-health-tracker
```

## 2. Select Node.js 22

When using NVM:

```bash
nvm install 22
nvm use 22
```

Confirm the active versions:

```bash
node --version
npm --version
```

The Node.js version should begin with `v22`.

## 3. Install dependencies

Run this command from the repository root:

```bash
npm install
```

This installs dependencies for the root project, frontend, and backend workspaces.

## 4. Create the environment files

### Frontend

Create `packages/frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Backend

Create `packages/backend/.env`:

```env
PORT=5000
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=replace-with-a-long-random-value
```

The frontend and backend must use the same Google Client ID.

## 5. Start the application

From the repository root:

```bash
npm run dev
```

This starts both workspaces:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:5000](http://localhost:5000)

Vite proxies `/api` and `/socket.io` requests to the backend during development.

The SQLite database is created automatically at:

```text
packages/backend/database.sqlite
```

No separate database server or migration command is required.

## 7. Sign in and test

1. Open [http://localhost:3000](http://localhost:3000).
2. Sign in with an authorized Google account.
3. For an account without previous history, the application offers an optional prepared sample dataset.
4. Accepting it creates the same 90-day wellbeing journey for that user, ending yesterday so the current day remains available.
5. Use **View trends** and select **3 Months** to inspect the complete example progression.
6. Use **History** to review the paginated entries.

## API overview

All log routes require a JWT in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/google` | Authenticate using a Google ID token |
| POST | `/api/log` | Create a daily check-in |
| GET | `/api/logs` | Get the complete series used by charts |
| GET | `/api/logs?page=1&limit=10` | Get paginated history |
| PUT | `/api/logs/:id` | Update today's check-in |
| POST | `/api/logs/sample-data` | Apply the prepared sample dataset |

## Data and security notes

- A unique database index prevents duplicate entries for the same user and date.
- The backend verifies ownership before returning or updating records.
- Only today's record can be edited.
- JWTs expire after seven days.
- Google credentials and JWT secrets belong only in local or deployment environment variables.
- The optional sample data is deterministic and identical for every user; only its calendar dates are positioned relative to yesterday.
- `*.sqlite`, `.env`, build output, and dependencies are excluded from Git.

## Author

Matias Rosas
