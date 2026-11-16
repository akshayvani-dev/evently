# Evently Frontend

The Evently frontend is a React single-page application for public event discovery, attendee registration, and organizer event management.

## Features

- Public landing page, event search/listing, and event details.
- Cookie-based sign-up, sign-in, session restoration, and sign-out.
- Organizer dashboard for creating, editing, publishing, canceling, and completing events, with attendee lists for owned events.
- Attendee views for all events, current registrations, canceled registrations, and completed events.
- Registration and cancellation confirmations, loading/error states, and toast notifications.
- Role-aware routes; backend authorization remains authoritative.

## Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4, Framer Motion, Lucide React
- Redux Toolkit and React Router
- React Hook Form and Zod for forms and validation

## Local Setup

Run these commands from `frontend/`:

```sh
npm install
```

Copy `.env.example` to `.env` and set the API base URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the backend separately and set its `CLIENT_URL` to the frontend origin,
`http://localhost:5173`, so credentialed API requests pass CORS checks. Then run:

```sh
npm run dev
```

Vite serves the app at `http://localhost:5173` by default. The API client sends
HTTP-only cookie credentials and defaults to `http://localhost:5000/api/v1` in
development when `VITE_API_BASE_URL` is not set.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page and event discovery |
| `/event-details/:id` | Public | Event details and attendee registration actions |
| `/auth` | Public | Sign in and sign up |
| `/dashboard` | Signed in | Role-specific dashboard |
| `/dashboard/events/all` | Organizer | All owned events |
| `/dashboard/events/active` | Organizer | Published events |
| `/dashboard/events/draft` | Organizer | Draft events |
| `/dashboard/events/canceled` | Organizer | Canceled events |
| `/dashboard/events/completed` | Organizer | Completed events |
| `/dashboard/events/create` | Organizer | Create an event |
| `/dashboard/events/:eventId` | Signed in | Event details; organizers can manage their own event |
| `/dashboard/events/:eventId/edit` | Organizer (owner) | Edit an upcoming owned event |
| `/dashboard/attendee/events/all` | Attendee | Browse events |
| `/dashboard/attendee/events/my` | Attendee | Active registrations |
| `/dashboard/attendee/events/canceled` | Attendee | Canceled registrations |
| `/dashboard/attendee/events/completed` | Attendee | Registrations for completed events |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run preview` | Preview the production bundle |
| `npm run lint` | Run TypeScript checking (`tsc --noEmit`) |

There is currently no frontend automated test script.

## Source Layout

```text
src/
  api/          # Event API client and response types
  components/   # Auth, dashboard, event, layout, section, and UI components
  hooks/        # Shared React hooks
  layouts/      # Dashboard layout
  lib/          # Axios client, validation, and shared utilities
  pages/        # Public, auth, event details, and dashboard pages
  routes/       # Public and role-protected route setup
  store/        # Redux store and authentication state
  types/        # Shared TypeScript types
  App.tsx
  main.tsx
```
