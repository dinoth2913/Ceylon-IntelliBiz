# Architecture Notes

## Target Platform

Ceylon IntelliBiz is a modular, cloud-ready enterprise platform designed for Sri Lanka. The architecture is intentionally split into independent services that can scale independently while sharing a common identity, data governance, and deployment pipeline.

## Service Boundaries

- Authentication Service: identity, OAuth2, RBAC, JWT, MFA
- Customer Service: CRM, contacts, customers, leads, opportunities
- Vendor Service: vendor onboarding, supplier management, catalog approvals
- Inventory Service: stock management, warehouses, procurement, replenishment
- Finance Service: invoices, payments, accounting, taxation, VAT/SVAT/NBT support
- Sales Service: deals, quotes, orders, commissions
- Analytics Service: dashboards, KPI aggregation, real-time reporting
- Notification Service: push, email, SMS, browser alerts
- Chat Service: internal collaboration and messaging
- AI Service: recommendation, OCR, forecasting, summarization, automation
- Payment Service: gateway orchestration with PayHere, Stripe, Genie, and bank integrations
- Report Service: PDF/Excel/CSV/Word generation and export workflows

## Data Strategy

- PostgreSQL for transactional systems and relational data
- MongoDB for document-oriented data and flexible entity models
- Redis for caching and session state
- Elasticsearch for search and analytics indexing

## Security Controls

- Spring Security and OAuth2
- JWT-based access control
- 2FA and SSO via Google/Microsoft
- Audit logging and encryption at rest/in transit
- Rate limiting, CSRF protection, XSS hardening, and input validation
