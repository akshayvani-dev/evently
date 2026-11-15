# Evently Backend

Initial backend scaffold for Evently, built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Setup

From the `evently-backend` directory:

```sh
npm install
```

Copy `.env.example` to `.env` and update `DATABASE_URL` (and `JWT_SECRET` for local use) with your local settings.

```sh
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The API health check is available at `http://localhost:5000/api/health`.
