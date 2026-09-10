# Basic React + NestJS - the example application

The working full-stack app the **Basic React + NestJS** course teaches
from: a small blog with a React frontend, a NestJS backend, Postgres and
MailHog in docker. You will read this code throughout the course, run
it, break it, and finally EXTEND it for your graded assignment
( see [TASK.md](TASK.md) ).

## Create your own repository first

1. Click **Use this template** -> **Create a new repository**.
2. Name it `firstname-lastname-basic-react-nestjs-answers` and make it
   **private**.
3. Invite your markers as collaborators ( the course names them ).
4. Clone YOUR repository, not this one.

## Prerequisites

- **nvm** ( Node version manager ) - the course's setup section shows
  the install; then `nvm install` in this folder picks up
  [.nvmrc](.nvmrc) ( Node 24 ).
- **pnpm** - `npm install -g pnpm` ( the one npm command you will run ).
- **Docker Desktop** ( you used docker in Basic Unix ).

## Run it

```
nvm use            # Node 24, from .nvmrc
make docker-up     # Postgres ( localhost:5433 ) + MailHog ( localhost:8025 )
make install       # pnpm install in backend, frontend and the repo root
make seed          # migrations + seed users and posts
make dev           # backend ( :3000 ) + frontend ( :5173 ) together
```

Open http://localhost:5173 and log in as a seeded user. Emails the app
sends ( account activation ) land in MailHog: http://localhost:8025.

## Seeded logins

Password for every seeded account: `Password123!`

| Email               | Role  | Notes                                   |
| ------------------- | ----- | --------------------------------------- |
| admin@example.com   | ADMIN | may edit anyone's posts                 |
| alice@example.com   | USER  |                                         |
| bob@example.com     | USER  |                                         |
| carla@example.com   | USER  |                                         |
| pw-one@example.com  | USER  | RESERVED for the Playwright tests       |
| pw-two@example.com  | USER  | RESERVED for the Playwright tests       |

Each seeded user already has 16+ posts, so the paged lists really page.
`make seed` resets the database to exactly this state at any time.

## The make targets

| Target                    | What it does                                        |
| ------------------------- | --------------------------------------------------- |
| `make install`            | install dependencies ( all three projects )         |
| `make docker-up` / `down` | start / stop Postgres + MailHog                     |
| `make seed`               | reset the database to the seeded state              |
| `make dev`                | backend + frontend together                         |
| `make test`               | backend unit + integration tests, frontend tests    |
| `make test-one TEST=x`    | one test file ( `.spec.ts` backend, `.test.tsx` frontend ) |
| `make e2e`                | Playwright journeys, headless ( seeds first )       |
| `make e2e-demo`           | the same journeys slowed + visible, for demos       |
| `make build`              | production builds of both projects                  |

`make test` and `make e2e` expect docker to be up. First Playwright
run: `pnpm exec playwright install chromium`.

## The map

```
backend/    NestJS + TypeORM + Postgres ( src/auth, src/users,
            src/interests, src/posts, src/mail, src/database )
frontend/   Vite + React + TypeScript ( src/pages, src/components,
            src/api, src/store, src/schemas )
e2e/        Playwright journeys + support/mailhog.ts
```

## The three test tiers

1. **Unit** - backend services in isolation ( jest ), frontend
   components against MSW ( vitest + Testing Library ).
2. **Integration** - the real HTTP API against the real dockerised
   Postgres and MailHog ( `backend/test/integration` ).
3. **End-to-end** - Playwright drives the real app in a browser; the
   activation email is fetched from MailHog by
   `e2e/support/mailhog.ts`.

On a fresh clone ALL provided tests are green - your graded task ADDS
functionality and tests; it never starts from red.
