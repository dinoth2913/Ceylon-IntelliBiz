# Ceylon IntelliBiz

AI-Powered Business Operating Platform for Sri Lanka.

## Overview

Ceylon IntelliBiz is a modular enterprise platform designed for Sri Lankan businesses and government organizations. It combines CRM, ERP, marketplace, inventory, finance, HR, sales, support, analytics, and AI automation into one secure and scalable product suite.

## Architecture

- Frontend: Next.js + TypeScript + Tailwind CSS + Shadcn UI
- Backend: Java Spring Boot with Spring Security and JWT
- AI Services: Python FastAPI with LangChain / LlamaIndex / PyTorch / TensorFlow
- Data Layer: MongoDB (the only database today). Redis and Elasticsearch are planned, not built.
- Infrastructure: Docker Compose, GitHub Actions, NGINX, AWS/Azure/GCP ready

## Repository Structure

- frontend/: Next.js web application for the executive experience
- backend/: Java Spring Boot services and API layer
- python-ai/: AI microservice and model orchestration
- docker/: Container definitions and local orchestration
- database/: MongoDB first-start setup script (creates the backend's database user)
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
| `MONGODB_ROOT_PASSWORD` | The MongoDB root user, used only to set the database up. The backend never uses it. |
| `MONGODB_APP_PASSWORD` | The backend's own database user, limited to reading and writing the app database. |
| `JWT_SECRET` | Signs login tokens. The backend refuses to start if it is missing, under 32 characters, or a placeholder. Anyone who knows it can forge a login for any user. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Password for the first admin (optional, see below). |
| `RECOVERY_ADMIN_USERNAME` / `RECOVERY_ADMIN_PASSWORD` | Force-resets that admin's password at startup (optional, see [Forgot a password?](#forgot-a-password)). |

- `.env` is gitignored. Never commit it; only `.env.example` (no values) is tracked.
- The databases and the AI service are only published on `127.0.0.1`, not to your network. Only the frontend (3000) and the API (8080) are exposed.
- **Rotate anything that ever used the old defaults.** Earlier versions of this repo shipped a default `JWT_SECRET` and the password `postgres` in git history. If you ever ran a deployment with those, treat it as compromised: use a new `JWT_SECRET` (this signs everyone out) and new database passwords.
- **Existing MongoDB volume:** the root and app users are only created when the data volume is first made. If you have a volume from an earlier version (it had no password), the backend will fail to sign in. Remove the volume (`docker compose --env-file .env -f docker/docker-compose.yml down -v`, which **deletes its data**) so it is recreated with authentication.

## Roles and the first admin

Anyone can sign up, but every new account starts as `STAFF`, which has **no access to business data** until an admin assigns a real role on the **Team** page (`/dashboard/team`).

| Role | Can read | Can change |
| --- | --- | --- |
| `ADMIN` | everything | everything, plus users and roles |
| `SALES` | customers, orders, invoices, inventory, vendors, insights | customers, orders, inventory, vendors, marketplace products, demo requests |
| `FINANCE` | customers, orders, invoices, inventory, vendors, insights | invoices |
| `STAFF` | nothing | nothing |

The access rules live in one place, [SecurityConfig.java](backend/src/main/java/com/ceylon/intellibiz/config/SecurityConfig.java), and any `/api` path without an explicit rule is admin-only. A user's role is read from the database on every request, so a change takes effect immediately. Adding a new controller and forgetting to add a rule for it is a real risk — `SecurityCoverageTest` fails the build if a controller's path is never mentioned in `SecurityConfig.java` at all (it can't check the rule is *correct*, just that someone made a conscious choice — `RoleAccessRulesTest` is the one that checks correctness).

Because sign-up can only create `STAFF`, the first admin is created at startup from configuration:

- `node scripts/generate-env.js` sets `BOOTSTRAP_ADMIN_PASSWORD` for you. If you write `.env` by hand, set it to 8+ characters, and optionally set `BOOTSTRAP_ADMIN_USERNAME` (default `admin`) and `BOOTSTRAP_ADMIN_EMAIL` (default `admin@ceylonintellibiz.local`). Log in with the email.
- It only acts when **no admin exists yet**, so leaving the variables in place is harmless. It never promotes an existing account, so if that username or email is already registered it logs a warning and does nothing.
- To make more admins, use the Team page. The last remaining admin can't be demoted.
- If you ran an earlier version where sign-up accepted a `role`, check for accounts that gave themselves privileges: `db.users.find({ role: { $ne: 'STAFF' } }, { username: 1, email: 1, role: 1 })` in `mongosh`.

### Forgot a password?

There's no email-based "forgot password" flow (the app doesn't send email), so recovery works two ways:

- **Anyone but the last admin:** an admin can reset it for you from the Team page. It generates a random password, shows it once, and the admin passes it to you directly — it's never emailed, logged or stored.
- **The only admin, locked out:** set `RECOVERY_ADMIN_USERNAME` and `RECOVERY_ADMIN_PASSWORD` in `.env`, restart the backend, sign in with the new password, then blank both variables and restart again (leaving them set resets the password back to that value on every restart). It only ever touches an account that's already an admin.

## Rate limiting

The public, unauthenticated POST endpoints — the demo-request form, the chat widget and marketplace
checkout — are limited to `RATE_LIMIT_MAX_REQUESTS` (default 5) calls per IP address per
`RATE_LIMIT_WINDOW_SECONDS` (default 60), enforced by [`RateLimitFilter`](backend/src/main/java/com/ceylon/intellibiz/security/RateLimitFilter.java). Going over it gets a `429` with a `Retry-After` header.

It's in-memory and per backend instance on purpose — this app runs as a single container with no Redis,
so a shared limiter isn't worth a new dependency at this scale. That means a restart clears it, and
running more than one backend instance would give each instance its own count instead of a shared one.
Authenticated write endpoints aren't rate-limited this way: a signed-in account is already identifiable
and its access can be revoked (Team page), which a bare-IP limiter isn't a substitute for.

## Database (MongoDB)

Everything is stored in one MongoDB database: users, customers, vendors, orders, invoices, inventory, demo requests, marketplace products, reviews and chat messages.

- Inside Docker Compose the backend reaches it at host `mongodb`. For a tool such as Compass, connect to `localhost:27018` (published on `127.0.0.1` only; change it with `MONGODB_PUBLISHED_PORT`) as the app user with authentication database `intellibiz`.
- [database/mongo-init.js](database/mongo-init.js) runs once, on the first start of an empty data volume. It creates the backend's restricted user and the marketplace/chat collections.
- The backend creates the remaining indexes itself at startup from its model classes. The important ones are unique indexes on usernames, emails, order numbers, invoice numbers and SKUs, so duplicates are refused with a 409.
- Record ids are MongoDB ObjectIds (24-character strings). Amounts are stored as `Decimal128`, so money stays exact.
- MongoDB has no foreign keys, so the backend checks in code that an order's or invoice's customer exists, and refuses to delete a customer that still has orders or invoices.
- Running the backend outside Docker: set `MONGODB_USERNAME`, `MONGODB_PASSWORD` (and `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_DATABASE`, `MONGODB_AUTH_DATABASE` if they differ from the defaults `localhost`, `27017`, `intellibiz`, `intellibiz`).
- To run the end-to-end tests against a real MongoDB, see the comment at the top of `MongoEndToEndTest`. Without one, `mvn test` skips them.
- Data from an earlier version that used PostgreSQL is **not** carried over. If you have real data there, it needs a one-off migration (ids change from numbers to ObjectIds).

## Roadmap

- Multi-factor authentication and SSO
- CRM and sales workflow modules
- Inventory and finance modules
- Marketplace storefront
- AI assistant and forecasting services
- Real-time collaboration and notifications
