# Evently

Evently is a small event management platform. Organizers create and manage events, and attendees discover events and register for them. The focus is a complete, correct product journey: strict access control, validated input, and a registration flow that never exceeds an event's capacity, even under simultaneous requests.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Data Model](#data-model)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Available Scripts](#available-scripts)
9. [API Reference](#api-reference)
10. [Authentication and Security](#authentication-and-security)
11. [Capacity and Concurrency](#capacity-and-concurrency)
12. [Business Rules](#business-rules)
13. [Testing](#testing)
14. [Design Decisions and Trade-offs](#design-decisions-and-trade-offs)
15. [Project Status](#project-status)
16. [Future Improvements](#future-improvements)
17. [AI Usage](#ai-usage)

---

## Features

**Organizer**
- Create, edit, cancel and delete their own events (title, description, start time with time zone, location, capacity, status)
- View all their events with capacity, active registrations and places left
- View the attendee list (name, email, registration time) of their own events only

**Attendee**
- Browse published, upcoming events and view event details with remaining places
- Register for an available event and cancel their own registration
- View their registrations with event details, with canceled ones clearly marked

**Platform**
- Access token and refresh token authentication stored in httpOnly cookies
- Role and ownership checks enforced by the backend, never only in the UI
- Race-safe registration: capacity can never be exceeded
- Soft delete and bulk cancellation when an event is canceled or deleted
- Audit trail of who canceled a registration (`canceled_by`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS, framer-motion, Redux Toolkit, React Router |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT access and refresh tokens in httpOnly cookies, bcrypt password hashing |
| Validation | zod |
| Testing | Jest, Supertest |

---

## Architecture

```mermaid
flowchart LR
    Browser["React SPA (Vite)"] -- "HTTPS + httpOnly cookies" --> API["Express API"]
    API --> MW["Middleware: auth, roles, validation, rate limit"]
    MW --> C["Controllers"]
    C --> S["Services (business rules, transactions)"]
    S --> P["Prisma Client"]
    P --> DB[("PostgreSQL")]
```

**Backend layering:** `routes -> controllers -> services -> Prisma`

- **Routes** define URLs and attach middleware (authentication, role checks, validation).
- **Controllers** are thin: parse the request, call a service, shape the response.
- **Services** hold all business rules, ownership checks and database transactions.
- **Prisma** is the only layer that talks to the database.

**Response format**

```json
// success
{ "success": true, "data": { } }

// error
{ "success": false, "message": "Event is full", "errors": [] }
```

Lists are paginated with `data.meta = { page, limit, total }`.

---

## Data Model

```mermaid
erDiagram
    users ||--o{ events : organizes
    users ||--o{ registrations : "registers"
    users ||--o{ registrations : "cancels (canceled_by)"
    users ||--o{ refresh_tokens : owns
    events ||--o{ registrations : has

    users {
        uuid id PK
        string name
        string email UK
        string password_hash
        enum role "organizer | attendee"
        timestamptz created_at
        timestamptz updated_at
    }
    events {
        uuid id PK
        uuid organizer_id FK
        string title
        text description
        timestamptz start_at
        string timezone "IANA name"
        string location
        int capacity "positive"
        enum status "draft | published | canceled"
        timestamptz deleted_at "soft delete"
        timestamptz created_at
        timestamptz updated_at
    }
    registrations {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        enum status "active | canceled"
        timestamptz registered_at
        timestamptz canceled_at
        uuid canceled_by FK
    }
    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz created_at
    }
```

**Key constraints and indexes**

- `users.email` is unique and stored lowercase.
- `events (status, start_at)` supports the public listing; `events (organizer_id)` supports the organizer dashboard.
- `registrations (event_id, status)` and `(user_id, status)` support counts and dashboards.
- **Partial unique index** prevents duplicate active registrations. Prisma cannot declare it, so it is added by hand in the initial migration:

```sql
CREATE UNIQUE INDEX registrations_event_user_active_uq
ON registrations (event_id, user_id)
WHERE status = 'active';
```

**Naming:** Prisma models are singular PascalCase (`User`), database tables are plural snake_case (`users`) via `@@map`, and columns are snake_case via `@map`. Application code is unaffected by the mapping.

---

## Project Structure

```
evently/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── routes/          # URL definitions
│   │   ├── controllers/     # request/response handling
│   │   ├── services/        # business logic and transactions
│   │   ├── middlewares/     # authenticate, authorize, validate, errors
│   │   ├── validators/      # zod schemas
│   │   ├── utils/           # tokens, cookies, hashing, AppError
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/               # Jest + Supertest integration tests
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # layout, sections, ui, events, auth
│   │   ├── pages/           # landing, event details, auth, dashboard
│   │   ├── store/           # Redux store and auth slice
│   │   ├── data/            # dummy events data
│   │   ├── hooks/ lib/ types/
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- PostgreSQL 14 or later (local install or Docker)

### 1. Clone the repository

```bash
git clone <repository-url>
cd evently
```

### 2. Start PostgreSQL

Using Docker:

```bash
docker run --name evently-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=evently_db -p 5432:5432 -d postgres:16
```

Or create the database in an existing install:

```sql
CREATE DATABASE evently_db;
```

### 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env        # then edit the values
npx prisma migrate deploy   # apply migrations
npx prisma generate
npm run dev
```

The API runs on the port set in `.env` (see `PORT`).

> **Creating the very first migration yourself?** Use `npx prisma migrate dev --name init --create-only`, then append the partial unique index SQL from [Data Model](#data-model) to the generated `migration.sql` before running `npx prisma migrate dev`.

### 4. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:5173` by default.

### 5. Accounts

There are no seeded accounts. Create one organizer and one attendee from the **Sign up** tab at `/auth`, choosing the role at sign up.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | `development`, `test` or `production` | `development` |
| `PORT` | API port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/evently_db?schema=public` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | long random string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (different from the access secret) | long random string |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `CLIENT_URL` | Allowed CORS origin of the frontend | `http://localhost:5173` |

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API | `http://localhost:5000/api/v1` |

Never commit real secrets. Only `.env.example` files belong in the repository.

---

## Available Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start the API in watch mode (`tsx watch src/server.ts`) |
| `npm run test` | Run the integration tests (`jest --runInBand`) |
| `npx prisma migrate deploy` | Apply existing migrations |
| `npx prisma migrate dev` | Create and apply a migration during development |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx prisma studio` | Browse the database in a UI |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |

---

## API Reference

Base URL: `/api/v1`. Authentication uses httpOnly cookies, so clients must send credentials (`credentials: "include"` or `withCredentials: true`).

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Register with name, email, password and role. Sets cookies, returns the user only |
| POST | `/auth/signin` | Public | Sign in with email and password. Sets cookies, returns the user only |
| POST | `/auth/refresh` | Cookie | Rotate the refresh token and issue new cookies |
| POST | `/auth/logout` | Cookie | Revoke the refresh token and clear cookies |
| GET | `/auth/me` | Authenticated | Current user |

### Events

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/events` | Public | Published, upcoming events (`?search=&category=&page=&limit=`) |
| GET | `/events/:id` | Public | Event details with places remaining |
| POST | `/events` | Organizer | Create an event |
| PUT | `/events/:id` | Organizer (owner) | Full update |
| PATCH | `/events/:id` | Organizer (owner) | Partial update, including status |
| DELETE | `/events/:id` | Organizer (owner) | Soft delete and cancel all active registrations |
| GET | `/users/me/events` | Organizer | Own events with capacity, active registrations and places left |

### Registrations

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/events/:eventId/registrations` | Attendee | Register for an event |
| GET | `/events/:eventId/registrations` | Organizer (owner) | Active attendees (name, email, registration time) |
| PATCH | `/registrations/:id/cancel` | Attendee (owner) | Cancel own registration |
| GET | `/users/me/registrations` | Attendee | Own registrations with event details (`?status=&page=&limit=`) |

### Status codes

| Code | Meaning |
|---|---|
| 200 / 201 | Success / created |
| 400 | Validation error or violated rule (for example capacity below active registrations) |
| 401 | Not authenticated |
| 403 | Wrong role or not the owner |
| 404 | Not found (including soft-deleted events) |
| 409 | Conflict: duplicate registration, event full, already canceled, or event not open |

---

## Authentication and Security

- **Access token** (short lived, 15 minutes) and **refresh token** (7 days) are JWTs set as cookies. Tokens are never returned in response bodies and never stored in `localStorage`.
- **Cookies:** `httpOnly`, `secure` in production, `sameSite` set, and the refresh cookie is scoped to the auth path.
- **Refresh token rotation:** every refresh revokes the old token and issues a new one. Only a SHA-256 hash of each refresh token is stored in the database.
- **Reuse detection:** presenting an already revoked refresh token revokes all of that user's refresh tokens.
- **Passwords** are hashed with bcrypt. Sign in failures return a generic message to avoid user enumeration.
- **Authorization:** `authenticate` and `authorize(...roles)` middleware, plus ownership checks inside services. Hiding buttons in the UI is never the only protection.
- **Hardening:** zod validation on all input, helmet, CORS restricted to `CLIENT_URL` with credentials, and rate limiting on sign in, sign up and refresh.
- **Frontend session:** the session lives in the httpOnly cookie. The client keeps only an `isLoggedIn` flag in `localStorage`; when it is true, the app calls `/auth/me` on load to verify the session and populate the Redux store.

---

## Capacity and Concurrency

The hardest requirement is handling simultaneous requests for the last place. Evently uses two layers:

1. **Row lock inside a transaction.** Registering, canceling and changing capacity each run in `prisma.$transaction` and first lock the event row:

   ```sql
   SELECT id, capacity, status, start_at FROM events WHERE id = $1 FOR UPDATE
   ```

   Concurrent requests for the same event are serialized. Inside the lock the service checks the event state, counts active registrations, compares with capacity, and only then inserts.

2. **Database constraint as a safety net.** The partial unique index guarantees one active registration per user per event. A unique violation (Prisma error `P2002`) is mapped to a `409` response.

Because cancel and capacity updates take the same lock, counts can never go stale mid-operation.

**How to verify:** the automated test fires 10 simultaneous registrations from different attendees at an event with capacity 1 and asserts that exactly one succeeds and the active count is 1. See [Testing](#testing).

---

## Business Rules

**Registering** is allowed only when the event exists, is not deleted, is `published`, has not started, and still has room. Only attendees can register. A second active registration for the same event returns `409`.

**Canceling a registration** is allowed only for its owner, only while it is `active`, and only before the event starts. Cancel is a soft cancel (status, `canceled_at`, `canceled_by`); rows are never deleted or reactivated, and registering again creates a new row.

**Canceling an event** sets its status to `canceled` and, in the same transaction, cancels all its active registrations with `canceled_by` set to the organizer.

**Deleting an event** is a soft delete (`deleted_at` set, status `canceled`) with the same bulk cancellation. Deleted events are excluded from every query.

**Updating an event:** only the owner can edit; canceled or deleted events cannot be edited; capacity must be a positive integer and cannot drop below the number of active registrations; the start time cannot be moved into the past.

**Who canceled:** `canceled_by = user_id` means the attendee canceled; any other value means the organizer canceled through an event cancel or delete.

---

## Testing

Tests are integration tests (Jest and Supertest) that run against a real PostgreSQL database.

```bash
cd backend
npm run test
```

Use a dedicated test database and set its connection string in the environment used by the tests, so development data is never touched. Apply migrations to it first with `npx prisma migrate deploy`.

**Coverage**

- Auth: sign up, sign in sets cookies and returns no tokens in the body, `/me` with and without a cookie, refresh rotation, rejection of reused refresh tokens, logout
- Events: organizer-only create, update and delete; attendees receive `403`; organizer B cannot modify organizer A's event; validation failures
- Registrations: duplicate registration rejected, full event rejected, canceling frees a place
- **Concurrency:** 10 simultaneous registrations on capacity 1 produce exactly 1 success
- Ownership: organizer B cannot read organizer A's attendee list; attendee A cannot cancel attendee B's registration
- Eligibility: cannot register for draft, canceled, deleted or already started events
- Event cancel and delete bulk-cancel registrations with the correct `canceled_by`
- Capacity cannot be reduced below the active registration count

Tests run with `--runInBand` because they share one database. The Jest timeout is set to 30 seconds to allow for database round trips.

---

## Design Decisions and Trade-offs

| Decision | Reason | Trade-off |
|---|---|---|
| PostgreSQL row lock (`FOR UPDATE`) for capacity | Simple, correct, and easy to explain | Serializes writes per event; fine at this scale, would need queueing or counters for very hot events |
| Partial unique index for duplicates | The database enforces the rule even if application code has a bug | Prisma cannot model it, so it lives in raw SQL in the migration |
| Soft cancel and soft delete | Preserves history and lets attendees see why a registration ended | Every query must exclude deleted rows |
| `canceled_by` user id | Tells attendee cancellations from organizer cancellations with no extra reason column | Requires joining or comparing with `user_id` to interpret |
| httpOnly cookie tokens | Tokens are not readable by JavaScript, reducing XSS exposure | Needs CSRF consideration (mitigated with `sameSite` and CORS) |
| Hashed, rotating refresh tokens | A database leak does not expose usable tokens; reuse is detectable | Extra table and logic |
| Event time stored as UTC plus IANA time zone | Correct display in the event's own zone | Clients must format using the stored zone |
| Singular models, plural snake_case tables | Follows Prisma and PostgreSQL conventions | Requires `@map` and `@@map` everywhere |

**Assumptions:** an event's attendee-facing state is derived from `status`, `start_at` and active registration count; only attendees register for events; organizers cannot register for events through the same account role.

**Production notes for shortcuts:** secrets come from environment variables (use a secrets manager in production), cookies must be served over HTTPS with `secure` enabled, and the database user should have least privilege.

---

## Project Status

**Completed**
- Backend: authentication with refresh rotation, event CRUD with ownership checks, registrations with race-safe capacity, soft delete and bulk cancellation, integration tests
- Frontend: landing page with dummy events, event details page, auth page UI with validation

**In progress / remaining**
- Connecting the frontend to the API (auth flow with Redux, public events listing and details from the API, registration actions)
- Organizer dashboard and attendee dashboard screens
- Event create and edit forms

> Update this section to match the final state before submission.

---

## Future Improvements

- Waitlist that promotes the next attendee when a place is freed
- Email notifications for registration, cancellation and event changes
- Event cover image upload and categories managed in the database
- Calendar export (`.ics`) and reminders
- Server-side search with Postgres full-text search
- Refresh token cleanup job and session management (list and revoke devices)
- CSRF tokens for stricter cookie protection, plus audit logging
- CI pipeline (lint, type-check, tests) and Docker Compose for one-command setup
- End-to-end tests (Playwright) and frontend component tests
- Deployment configuration and observability (structured logs, metrics)

---

## AI Usage

AI coding assistants were used for scaffolding, drafting prompts and code, and generating tests. All generated code was reviewed, run and verified by the author, who can explain and modify any part of it, including the data model, the locking strategy and the authentication flow. No real credentials or confidential data were shared with external tools.