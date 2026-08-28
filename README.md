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
- A Google OAuth Web Client ID

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

## 4. Configure Google OAuth

The evaluator credentials should be shared privately and must not be committed to the repository.

To create credentials manually:

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a Google Cloud project.
3. Open **APIs & Services!’ OAuth consent screen**.
4. Configure the consent screen. If the application remains in testing mode, add the evaluator accounts as test users.
5. Open **APIs & Services!’ Credentials**.
6. Select **Create credentials!’ OAuth client ID**.
7. Choose **Web application**.
8. Add this Authorized JavaScript origin:

```text
http://localhost:3000
```

9. Copy the generated Client ID.

This application verifies the Google ID token using the Client ID. A Google Client Secret is not required by the current authentication flow and must never be exposed in the frontend.

## 5. Create the environment files

### Frontend

Create `packages/frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

You can start from the provided example:

```bash
cp packages/frontend/.env.example packages/frontend/.env
```

### Backend

Create `packages/backend/.env`:

```env
PORT=5000
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=replace-with-a-long-random-value
APP_TIME_ZONE=America/Santiago
```

The frontend and backend must use the same Google Client ID.

You can start from the provided example:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Generate a suitable JWT secret with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not commit either `.env` file.

## 6. Start the application

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

## Available commands

From the repository root:

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build --workspace=frontend
npm run lint --workspace=frontend
npm run start --workspace=backend
```

## Production build

Build the frontend:

```bash
npm run build --workspace=frontend
```

The static output is generated in `packages/frontend/dist`.

Start the backend:

```bash
npm run start --workspace=backend
```

For production hosting, serve the frontend build from a static host and route `/api` and `/socket.io` to the Node.js backend. The current repository is configured for local assessment URLs; production origins and HTTPS proxy settings should be adjusted for the selected hosting provider.

Persist `packages/backend/database.sqlite` on durable storage when deploying the backend. SQLite must not be placed on an ephemeral filesystem if records need to survive restarts.

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

## Troubleshooting

### `ENOENT: no such file or directory, open package.json`

Run npm commands from the project root:

```bash
cd /path/to/mental-health-tracker
npm run dev
```

### Backend fails after changing Node versions

Select Node 22 and rebuild the native SQLite dependency:

```bash
nvm use 22
npm rebuild sqlite3
```

### Google login is rejected

Check that:

- Both environment files contain the same Client ID.
- `http://localhost:3000` is an Authorized JavaScript origin.
- The account is included as a test user when the OAuth consent screen is in testing mode.
- The development servers were restarted after editing environment files.

### Frontend reports `ECONNREFUSED 127.0.0.1:5000`

The backend is not running. Start both workspaces from the repository root:

```bash
npm run dev
```

## Author

Matias Rosas
