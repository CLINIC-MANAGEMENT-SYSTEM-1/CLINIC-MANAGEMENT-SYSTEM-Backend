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
