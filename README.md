# Clinic Management System, Backend

## Requirements

- Node.js >= 20.6
- PostgreSQL 16 (needed from EN-02)

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

| Script         | Description                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------- |
| `start`        | Starts the server with `node src/server.js`                                                   |
| `dev`          | Runs server in watch mode with `.env` file loaded via `nodemon --env-file=.env src/server.js` |
| `test`         | Runs test suites with Jest                                                                    |
| `lint`         | Lints codebase with ESLint                                                                    |
| `format`       | Formats codebase with Prettier                                                                |
| `format:check` | Checks formatting with Prettier                                                               |

## Environment Variables

| Variable        | Type                                    | Default       | Required |
| --------------- | --------------------------------------- | ------------- | -------- |
| `NODE_ENV`      | `development` \| `test` \| `production` | `development` | No       |
| `PORT`          | number (integer, positive)              | `3000`        | No       |
| `DATABASE_URL`  | string (URL)                            | -             | Yes      |
| `JWT_SECRET`    | string (min 32 characters)              | -             | Yes      |
| `CLINIC_TZ`     | string                                  | `Asia/Hebron` | No       |
| `COOKIE_SECURE` | enum (`'true'` \| `'false'`) -> boolean | -             | Yes      |
| `CLIENT_ORIGIN` | string (URL)                            | -             | Yes      |

## Project Structure

```
.
├── .github/
│   └── pull_request_template.md
├── docs/
│   └── CONVENTIONS.md
├── src/
│   ├── common/
│   │   └── .gitkeep
│   ├── config/
│   │   └── env.js
│   ├── controllers/
│   │   └── health.controller.js
│   ├── db/
│   │   ├── pool.js
│   │   └── withTransaction.js
│   ├── jobs/
│   │   └── .gitkeep
│   ├── models/
│   │   └── .gitkeep
│   ├── routes/
│   │   ├── health.routes.js
│   │   └── index.js
│   ├── validators/
│   │   └── .gitkeep
│   ├── app.js
│   └── server.js
├── tests/
│   ├── health.test.js
│   ├── setupEnv.js
│   └── withTransaction.test.js
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── eslint.config.js
├── jest.config.js
├── package-lock.json
├── package.json
└── README.md
```

Future file naming:

```
src/routes/<domain>.routes.js
src/controllers/<domain>.controller.js
src/models/<domain>.model.js
src/validators/<domain>.validator.js
domains: auth, staff, patients, appointments, clinical, billing, reports
src/jobs/<job>.js          (nightly no-show job, US-46)
src/common/                (shared helpers and middleware from EN-03: response, validate, asyncHandler, AppError, errorHandler, audit)
```

## Conventions

See [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for architectural conventions, layer boundaries, and coding rules.

## Health Check

`GET /api/health` -> `200 { success: true, data: { status: 'ok' } }`

## Local Database Setup

### Prerequisites

- Node.js (version 20.6 or later)
- PostgreSQL installed and running
- Git

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

Update the values in `.env` to match your local environment.

- `DATABASE_URL`: PostgreSQL connection URL for your local development database.
- `JWT_SECRET`: A random secret of at least 32 characters.
- `COOKIE_SECURE`: Set to `false` for local HTTP development.
- `CLIENT_ORIGIN`: The local frontend URL.
- `SEED_PASSWORD`: A local demo password used for seeded accounts.

**Do not commit `.env` or share real secrets.**

### 3. Create the Development Database

```powershell
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE clinic_dev;"
```

If the database already exists, skip this step.

### 4. Initialize the Database Schema

```powershell
psql -U postgres -h localhost -p 5432 -d clinic_dev -f src/db/schema.sql
```

### 5. Seed Development Data

```bash
npm run seed
```

The seed script creates demo data, including:

- One clinic owner
- Two doctors
- Doctor working hours
- Twenty demo patients

The seeded owner and doctor accounts use the email addresses below and share the password configured in `SEED_PASSWORD`:

- `owner@clinic.example.test`
- `doctor1@clinic.example.test`
- `doctor2@clinic.example.test`

These accounts are for local development only.

### Notes

- Each team member should use their own local `.env` file and development database.
- Run the schema setup before running the seed script.
- The seed script can be run repeatedly without duplicating the same demo records in a fresh development database.
