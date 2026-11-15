# Evently — Event Discovery & Management Landing Page

Modern dark-themed landing page UI for **Evently**, an event management platform where organizers publish events and attendees discover and register for them.

## Tech Stack

- React 19 + TypeScript (strict mode)
- Vite
- Tailwind CSS v4 (custom theme tokens & Poppins typography)
- Framer Motion (`prefers-reduced-motion` aware)
- Lucide React icons

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Build

```bash
npm run build
npm run lint
```

## Project Structure

```text
src/
  components/
    layout/       # Navbar, Footer
    sections/     # Hero, SearchFilter, EventsGrid, HowItWorks, ForOrganizers, CtaBanner
    ui/           # Button, Badge, Container, SectionHeading, Skeleton, ProgressBar
    events/       # EventCard
  data/events.ts  # Dummy event catalog across availability states
  types/event.ts  # Event, filter, and availability TypeScript types
  lib/utils.ts    # Date/timezone formatting, availability computation, class helper
  hooks/          # useScrolled
  App.tsx
  main.tsx
  index.css
```
