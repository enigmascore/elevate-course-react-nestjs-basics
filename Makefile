# Basic React + NestJS course - the one entry point for everything.
# The student and the MARKER use exactly these targets; no IDE needed.

.PHONY: help install dev dev-backend dev-frontend test test-one e2e e2e-demo seed build docker-up docker-down db-check

# Bare `make` lists the targets instead of running the first one.
.DEFAULT_GOAL := help

# Test targets run HEADLESS; the e2e-demo target below shows the browser.
# Override with HEADLESS= ( empty ) to watch a run; SLOWMO=<ms> slows every action.
HEADLESS ?= 1

help: ## List all targets with their descriptions
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies in all three projects ( backend, frontend, e2e )
	cd backend && pnpm install
	cd frontend && pnpm install
	pnpm install

docker-up: ## Start Postgres + MailHog ( the backend expects them )
	docker compose up -d

docker-down: ## Stop Postgres + MailHog
	docker compose down

# Not listed in help: a guard that turns "connection refused" into a hint.
db-check:
	@docker compose ps --status running --services 2>/dev/null | grep -q postgres || \
	  { echo "Postgres is not running - start it with: make docker-up"; exit 1; }

seed: db-check ## Reset the database to the seeded state ( migrations + seed users/posts )
	cd backend && pnpm seed

dev: db-check ## Run backend ( :3000 ) + frontend ( :5173 ) together ( expects docker-up )
	@trap 'kill 0' INT TERM; \
	( cd backend && pnpm dev ) & \
	( cd frontend && pnpm dev ) & \
	wait

dev-backend: db-check ## Run only the NestJS backend ( :3000 )
	cd backend && pnpm dev

dev-frontend: ## Run only the frontend ( :5173; /api calls need the backend up )
	cd frontend && pnpm dev

test: db-check ## All unit + integration tests ( integration needs docker-up )
	cd backend && pnpm test
	cd frontend && pnpm test

test-one: ## One test file: make test-one TEST=posts.service.spec.ts | TEST=LoginPage.test.tsx
	@case "$(TEST)" in \
	  *.test.tsx|*.test.ts) cd frontend && pnpm vitest run "$(TEST)" ;; \
	  *) cd backend && pnpm jest "$(TEST)" ;; \
	esac

e2e: seed ## Playwright end-to-end journeys, headless ( seeds first; expects docker-up )
	HEADLESS=$(HEADLESS) pnpm exec playwright test

# HEADLESS is forced empty so an exported value never hides the browser.
e2e-demo: seed ## The same journeys slowed + VISIBLE, for demos
	HEADLESS= SLOWMO=2000 pnpm exec playwright test --workers=1

build: ## Production builds of both projects
	cd backend && pnpm build
	cd frontend && pnpm build
