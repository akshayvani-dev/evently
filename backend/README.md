# Evently Backend

Backend for Evently, built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/evently?schema=public"
JWT_ACCESS_SECRET=replace_with_a_secure_random_access_secret_min_32_chars
JWT_REFRESH_SECRET=replace_with_a_secure_random_refresh_secret_min_32_chars
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

## Setup & Running Migrations

1. **Install dependencies**:
   ```sh
   npm install
   ```

2. **Generate Prisma client and run database migrations**:
   ```sh
   npm run prisma:generate
   npm run prisma:migrate
   ```

## Running the Application

- **Development mode** (with tsx hot-reloading):
  ```sh
  npm run dev
  ```
- **Production build & start**:
  ```sh
  npm run build
  npm start
  ```

API health check endpoint: `http://localhost:5000/api/health`.

## Running Tests

Integration tests are implemented using Jest and Supertest against the PostgreSQL database:

```sh
npm test
```

## Authentication System & Flow

The authentication system is built around secure, cookie-based token handling with refresh token rotation and reuse detection.

### Endpoints (`/api/auth`)

1. `POST /api/auth/signup`:
   - Body: `{ name, email, password, role }` (`role`: `organizer` | `attendee`)
   - Normalizes email (lowercase & trimmed), hashes password using `bcrypt` (12 rounds).
   - Issues short-lived access token and long-lived refresh token in HTTP-only cookies.
   - Stores SHA-256 hash of refresh token in database.
   - Returns status `201` with sanitized user object (never returns tokens or `passwordHash` in response body).

2. `POST /api/auth/signin`:
   - Body: `{ email, password }`
   - Verifies credentials (generic message on failure to prevent user enumeration).
   - Issues new token pair via cookies and returns sanitized user object (status `200`).

3. `POST /api/auth/refresh`:
   - Reads `refreshToken` cookie (scoped to path `/api/auth`).
   - Verifies cryptographic signature and checks database record by SHA-256 hash.
   - **Reuse Detection**: If an already-revoked refresh token is presented, all refresh tokens for that user are immediately revoked, cookies are cleared, and `401 Unauthorized` is returned.
   - **Rotation**: If valid, the presented token is marked revoked, a new access token and refresh token are created, the new hash is stored in DB, and updated cookies are set.

4. `POST /api/auth/logout`:
   - Revokes presented refresh token in database and clears both access and refresh cookies.
   - Always returns `200 OK` even if cookies are missing or invalid.

5. `GET /api/auth/me`:
   - Protected with `authenticate` middleware.
   - Validates `accessToken` cookie and retrieves the current authenticated user (`200 OK`).

### Security Features

- **Cookies**: `httpOnly: true`, `sameSite: "lax"`, `secure: true` in production. Refresh token cookie path is restricted to `/api/auth`.
- **Token Storage**: Refresh tokens are stored only as SHA-256 hashes in PostgreSQL; raw tokens are never persisted.
- **Rate Limiting**: `express-rate-limit` throttles auth endpoints against brute force attacks.
- **Role-Based Access Control**: `authenticate` attaches `req.user`, and `authorize(...roles)` gates endpoints by role.
- **Input Validation**: Strict input schemas with Zod enforce strong passwords, email formats, and role enums.
- **Centralized Errors**: Consistent error responses `{ success: false, message, errors? }`.


## Event Management API (`/api/events`)

All endpoints under `/api/events` are protected with `authenticate` and `authorize('organizer')`.

### Endpoints

1. `POST /api/events`:
   - Creates a new event.
   - `organizerId` is automatically extracted from `req.user.id`.
   - Returns status `201` with `{ success: true, data: { event } }`.
2. `PUT /api/events/:id`:
   - Full update requiring all fields: `title`, `description`, `startAt`, `timezone`, `location`, `capacity`, and `status`.
   - Validates ownership (403 if belonging to another organizer, 404 if not found).
   - Enforces status rule (cannot transition out of `canceled`).
   - Returns status `200` with `{ success: true, data: { event } }`.
3. `PATCH /api/events/:id`:
   - Partial update (any non-empty subset of allowed fields).
   - Validates ownership (403 if belonging to another organizer, 404 if not found).
   - Enforces status rule (cannot transition out of `canceled`).
   - Returns status `200` with `{ success: true, data: { event } }`.
4. `DELETE /api/events/:id`:
   - Deletes the event.
   - Validates ownership (403 if belonging to another organizer, 404 if not found).
   - Returns status `200` with `{ success: true, data: { message: 'Event deleted successfully' } }`.

### Validation Rules
- `title`: string, min 1, max 255
- `description`: string, min 1
- `startAt`: valid future date (ISO 8601)
- `timezone`: valid IANA timezone name (validated using standard `Intl.DateTimeFormat`)
- `location`: string, min 1, max 255
- `capacity`: positive integer (`> 0`)
- `status`: enum `draft | published | canceled` (defaults to `draft` on create)
- Unknown fields (such as `id`, `organizerId`, `createdAt`) are rejected via `.strict()`.
