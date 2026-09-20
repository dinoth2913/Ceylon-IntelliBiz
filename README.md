# Ceylon IntelliBiz

AI-Powered Business Operating Platform for Sri Lanka.

## Overview

Ceylon IntelliBiz is a modular enterprise platform designed for Sri Lankan businesses and government organizations. It combines CRM, ERP, marketplace, inventory, finance, HR, sales, support, analytics, and AI automation into one secure and scalable product suite.

## Architecture

- Frontend: Next.js + TypeScript + Tailwind CSS + Shadcn UI
- Backend: Java Spring Boot with Spring Security and JWT
- AI Services: Python FastAPI with LangChain / LlamaIndex / PyTorch / TensorFlow
- Data Layer: PostgreSQL, MongoDB, Redis, Elasticsearch
- Infrastructure: Docker Compose, GitHub Actions, NGINX, AWS/Azure/GCP ready

## Repository Structure

- frontend/: Next.js web application for the executive experience
- backend/: Java Spring Boot services and API layer
- python-ai/: AI microservice and model orchestration
- docker/: Container definitions and local orchestration
- database/: PostgreSQL schema and seed assets
- docs/: Architecture and implementation references
- .github/: CI workflows and automation
- scripts/: Setup and convenience scripts

## Quick Start

1. Clone the repository.
2. Create your secrets: `node scripts/generate-env.js`. This writes `.env` with random values for the database password, the login-token signing key and the first admin's password, and prints the admin login once. See [Secrets](#secrets).
3. Start the stack: `docker compose --env-file .env -f docker/docker-compose.yml up --build`
4. Open the frontend at http://localhost:3000 and sign in as the admin (see [Roles and the first admin](#roles-and-the-first-admin)).
5. Open the API health endpoint at http://localhost:8080/api/health
6. Open the AI health endpoint at http://localhost:8000/health

The database connectivity check at `/api/db-test` is admin-only, so call it with an admin's bearer token.

## Secrets

There are no default passwords or signing keys in the code. The stack won't start until these are set (`node scripts/generate-env.js` does it for you):

| Variable | What it does |
| --- | --- |
| `POSTGRES_PASSWORD` | Database password, used by both the database and the backend. |
| `JWT_SECRET` | Signs login tokens. The backend refuses to start if it is missing, under 32 characters, or a placeholder. Anyone who knows it can forge a login for any user. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Password for the first admin (optional, see below). |

- `.env` is gitignored. Never commit it; only `.env.example` (no values) is tracked.
- The databases and the AI service are only published on `127.0.0.1`, not to your network. Only the frontend (3000) and the API (8080) are exposed.
- **Rotate anything that ever used the old defaults.** Earlier versions of this repo shipped a default `JWT_SECRET` and the password `postgres` in git history. If you ever ran a deployment with those, treat it as compromised: use a new `JWT_SECRET` (this signs everyone out) and a new database password.
- **Existing database volume:** Postgres only reads `POSTGRES_PASSWORD` when it first creates the data volume. If you already have one, either change the password inside the database (`ALTER USER postgres PASSWORD '...';`) to match your new `.env`, or remove the volume (`docker compose ... down -v`, which deletes its data).

## Roles and the first admin

Anyone can sign up, but every new account starts as `STAFF`, which has **no access to business data** until an admin assigns a real role on the **Team** page (`/dashboard/team`).

| Role | Can read | Can change |
| --- | --- | --- |
| `ADMIN` | everything | everything, plus users and roles |
| `SALES` | customers, orders, invoices, inventory, vendors, insights | customers, orders, inventory, vendors, marketplace products, demo requests |
| `FINANCE` | customers, orders, invoices, inventory, vendors, insights | invoices |
| `STAFF` | nothing | nothing |

The access rules live in one place, [SecurityConfig.java](backend/src/main/java/com/ceylon/intellibiz/config/SecurityConfig.java), and any `/api` path without an explicit rule is admin-only. A user's role is read from the database on every request, so a change takes effect immediately.

Because sign-up can only create `STAFF`, the first admin is created at startup from configuration:

- `node scripts/generate-env.js` sets `BOOTSTRAP_ADMIN_PASSWORD` for you. If you write `.env` by hand, set it to 8+ characters, and optionally set `BOOTSTRAP_ADMIN_USERNAME` (default `admin`) and `BOOTSTRAP_ADMIN_EMAIL` (default `admin@ceylonintellibiz.local`). Log in with the email.
- It only acts when **no admin exists yet**, so leaving the variables in place is harmless. It never promotes an existing account, so if that username or email is already registered it logs a warning and does nothing.
- To make more admins, use the Team page. The last remaining admin can't be demoted.
- If you ran an earlier version where sign-up accepted a `role`, check for accounts that gave themselves privileges: `SELECT username, email, role FROM users WHERE role <> 'STAFF';`

## PostgreSQL Connection Notes

- The backend uses the PostgreSQL service name `db` inside Docker Compose, so the JDBC URL is `jdbc:postgresql://db:5432/intellibiz`.
- The database name and user default to `intellibiz` and `postgres` (override with `POSTGRES_DB` / `POSTGRES_USER`). The password comes from `POSTGRES_PASSWORD` in `.env`; there is no default.
- The initialization SQL file is loaded from [database/schema.sql](database/schema.sql) automatically when the Postgres container starts for the first time.

## Roadmap

- Multi-factor authentication and SSO
- CRM and sales workflow modules
- Inventory and finance modules
- Marketplace storefront
- AI assistant and forecasting services
- Real-time collaboration and notifications
