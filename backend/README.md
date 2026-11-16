# Evently Backend

The Evently backend provides the REST API for event discovery, organizer event
management, attendee registration, and authentication. It is built with
Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Requirements

- Node.js and npm
- PostgreSQL

## Local Setup

Create a PostgreSQL database, then from `backend/` install dependencies:

```sh
npm install
```

Copy `.env.example` to `.env`. Set `DATABASE_URL` and replace both JWT secret
values with independent random secrets of at least 32 characters. For the
default Vite development server, keep `CLIENT_URL=http://localhost:5173`.

Generate the Prisma client and apply migrations:

```sh
npm run prisma:generate
npm run prisma:migrate
```

`npm run prisma:migrate` uses `prisma migrate dev` and is intended for local
development. To apply committed migrations in a deployment, use:

```sh
npx prisma migrate deploy
```

Start the API:

```sh
npm run dev
```

The API listens on `http://localhost:5000` by default. Check
`http://localhost:5000/api/v1/health` for service health.

## Environment Variables

| Variable | Purpose | Default/example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | See `.env.example` |
| `JWT_ACCESS_SECRET` | Access-token signing key; at least 32 characters | Required |
| `JWT_REFRESH_SECRET` | Refresh-token signing key; use a different key from the access secret | Required |
| `ACCESS_TOKEN_EXPIRES_IN` | Access-token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh-token lifetime | `7d` |
| `CLIENT_URL` | Exact frontend origin allowed by credentialed CORS | `http://localhost:5173` |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run the API with `tsx watch` |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run Jest/Supertest integration tests |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create/apply development migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## API

All API routes are prefixed with `/api/v1`. Successful responses use
`{ "success": true, "data": ... }`; errors use
`{ "success": false, "message": "...", "errors": ... }`.

Paginated list responses put pagination metadata under `data.pagination`:

```json
{
  "page": 1,
  "limit": 20,
  "total": 42,
  "totalPages": 3,
  "hasNextPage": true
}
```

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/api/v1/auth/signup` | Public |
| `POST` | `/api/v1/auth/signin` | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh-token cookie |
| `POST` | `/api/v1/auth/logout` | Public; clears session cookies |
| `GET` | `/api/v1/auth/me` | Authenticated |

Access and refresh tokens are sent as HTTP-only cookies, not in response
bodies. The refresh cookie is scoped to `/api/v1/auth`; cookies use `SameSite=Lax`
and are `Secure` in production. Refresh tokens are stored as SHA-256 hashes and
rotated transactionally. Reuse of a revoked token triggers revocation of the
user's active refresh tokens. Signup, signin, and refresh are rate-limited to
20 requests per IP per 15 minutes; the limiter is skipped in test mode.

### Events

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/events/public` | Public (optional authentication) | List published events |
| `GET` | `/api/v1/events/public/:id` | Public (optional authentication) | View public event details |
| `GET` | `/api/v1/events?status=&title=&page=&limit=` | Organizer | List the organizer's events |
| `GET` | `/api/v1/events/:id` | Organizer (owner) | View an owned event |
| `POST` | `/api/v1/events` | Organizer | Create an event |
| `PUT` | `/api/v1/events/:id` | Organizer (owner) | Replace event details |
| `PATCH` | `/api/v1/events/:id` | Organizer (owner) | Partially update details or status |
| `DELETE` | `/api/v1/events/:id` | Organizer (owner) | Soft-delete an event |

The public list accepts `title`, `dateFilter`, `page`, and `limit`. Organizer
lists accept `status`, `title`, `page`, and `limit`. Optional authentication on
public endpoints allows attendee responses to include that attendee's
registration status.

Event statuses are `draft`, `published`, `canceled`, and `completed`. Event
creation defaults to `draft`; status changes are made with `PATCH`. Organizers
can edit or restore a canceled event while it has not started. Events cannot be
modified after their start time. A soft-deleted event is unavailable.

### Registrations

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/events/:eventId/registrations` | Attendee | Register for an event |
| `PATCH` | `/api/v1/registrations/:id/cancel` | Attendee (owner) | Cancel a registration |
| `GET` | `/api/v1/users/me/registrations?status=&title=&page=&limit=` | Attendee | List the attendee's registrations |
| `GET` | `/api/v1/events/:eventId/registrations?page=&limit=` | Organizer (event owner) | List active event attendees |

Registration-list responses include either `data.registrations` or
`data.attendees`, plus the common `data.pagination` object described above.
Registration status filters are `active`, `canceled`, and `completed`.

Registration is allowed only for a published event that has not started and
has capacity remaining. Registering and canceling use database transactions
and lock the event row so simultaneous requests cannot oversubscribe capacity.
Event cancellation bulk-cancels active registrations. Attendees may cancel
their own active registration before the event starts; the registration row is
kept for history.

## Security and Access Control

- `authenticate` validates the access cookie and loads the current user;
  `authorize` enforces organizer/attendee roles.
- Organizer event updates and attendee lists verify ownership in the service
  layer, not only in the frontend.
- Request bodies and query parameters are validated with Zod.
- Passwords use bcrypt; auth endpoints have an IP-based rate limiter.
- Helmet and credentialed CORS are enabled. Configure `CLIENT_URL` to the exact
  frontend origin used by the deployment.

## Tests

Tests use Jest and Supertest with a PostgreSQL database. They cover auth,
authorization, event updates, registration behavior, and capacity concurrency.
Use a **dedicated test database**: test setup clears database tables between
cases. Set `NODE_ENV=test` and configure `DATABASE_URL` before running:

```sh
npx prisma migrate deploy
npm test
```

## Source Layout

```text
prisma/       # Prisma schema and migrations
src/
  config/     # Environment validation
  controllers/# HTTP request/response handling
  errors/     # Application errors
  lib/        # Prisma client
  middlewares/# Authentication, validation, rate limiting, errors
  routes/     # API route registration
  services/   # Business logic and transactions
  types/      # Shared backend types
  utils/      # Cookies, hashing, and tokens
  validators/ # Zod schemas
tests/        # Jest/Supertest integration tests
```
