# Home Inspiration Generator

Home Inspiration Generator is a web app that helps users generate realistic interior design inspirations for specific rooms, based on their own photos of unfinished spaces plus a set of inspiration images. It also provides short, practical bullet-point suggestions (e.g., zoning, lighting) to support early decision making before meeting an architect or starting renovation.

## Table of contents

1. [Project name](#project-name)
2. [Project description](#project-description)
3. [Tech stack](#tech-stack)
4. [Getting started locally](#getting-started-locally)
5. [Available scripts](#available-scripts)
6. [Project scope](#project-scope)
7. [Project status](#project-status)
8. [License](#license)

## Project name

Home Inspiration Generator

## Project description

The core flow in MVP:

- Add rooms to the default apartment from predefined room types (e.g., kitchen, bathroom, bedroom, living room).
- Select a room to work on (all actions are scoped to the active room).
- Upload images per room:
  - minimum: 1 “unfinished room” photo and 2 inspiration photos,
  - formats: `jpg`, `png`, `heic`,
  - total upload limit: up to 10 files,
  - optional short description per photo.
- Generate inspiration variants for the selected room:
  - each variant is an “inspiration card” with 2 images of the same idea,
  - output format: `jpg`, resolution: 1080×720,
  - each variant includes short bullet-point suggestions.
- Generate multiple variants for the same room (with daily limits):
  - max 5 variants/day per authenticated user,
  - for anonymous users the limit is enforced per device/browser.
- Save an inspiration card:
  - saving requires authentication (soft-gate),
  - user provides a name (and optional style),
  - saved cards are assigned to a room,
  - saved inspirations are private per user.

Analytics (MVP): record the `InspirationSaved` event.

## Tech stack

Frontend:

- [Astro 5](https://astro.build/) (with Node adapter)
- [React 19](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Radix primitives, class-variance-authority, lucide-react)

Backend:

- [Supabase](https://supabase.com/) (Auth, Postgres, Storage, RLS)

AI:

- [OpenRouter](https://openrouter.ai/) (AI model routing)

CI/CD & hosting:

- GitHub Actions (planned)
- DigitalOcean (planned)

## Getting started locally

### Prerequisites

- Node.js `22.14.0` (see `.nvmrc`)
- npm (bundled with Node)

If you use `nvm`:

```bash
nvm install
nvm use
```

### Install & run

```bash
npm install
npm run dev
```

Then open the URL printed by Astro (typically `http://localhost:4321`).

### Build & preview

```bash
npm run build
npm run preview
```

## Available scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start Astro dev server               |
| `npm run build`    | Build for production                 |
| `npm run preview`  | Preview the production build locally |
| `npm run astro`    | Run the Astro CLI                    |
| `npm run lint`     | Run ESLint                           |
| `npm run lint:fix` | Fix ESLint issues                    |
| `npm run format`   | Format files with Prettier           |

## Testing

### Unit & component tests (Vitest)

```bash
npm run test
```

Testy jednostkowe i komponentowe są uruchamiane przez Vitest (z wykorzystaniem Testing Library i środowiska jsdom).

### E2E tests (recommended)

Testy E2E są rekomendowane w planie testów, ale nie są jeszcze skonfigurowane w repozytorium.

## Project scope

In scope (MVP):

- Room list owned by the authenticated user (no projects concept)
- Add/select rooms (predefined room types)
- Per-room image upload with validation (min 1 room photo + min 2 inspiration photos, max 10 files)
- Generate inspiration variants per room (2 images + bullet-point suggestions)
- Daily generation limits (5/day) for authenticated users, and per-device/browser enforcement for anonymous users
- Soft-gate authentication when saving inspirations
- Save inspirations to a private user gallery with filtering by room
- Analytics event: `InspirationSaved`

Out of scope (MVP):

- Mobile app (web-only)
- Non-image documents (no PDF/DOC)
- Data deletion flows and defined retention policy
- Detailed technical plans, furniture layouts, and dimensioning
- Sharing inspirations with other users
- Projects concept / multiple apartment projects (create/delete/switch)

## Project status

MVP is in development.

- Generation is limited to 5 variants/day per user (or per device/browser for anonymous usage).
- Saving inspirations requires authentication (soft-gate).

## License

No license has been specified yet.

If you intend this repository to be open source, add a `LICENSE` file (e.g., MIT) and set the `license` field in `package.json`.
