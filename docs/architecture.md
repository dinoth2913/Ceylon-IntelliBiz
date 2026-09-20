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

- MongoDB is the single database for all data: users, customers, vendors, orders, invoices, inventory, demo requests, marketplace products, reviews and chat messages
- Referential checks that a relational database would enforce (an order's customer must exist, a customer with orders can't be deleted) are done in the application, and uniqueness is enforced with unique indexes
- Money is stored as Decimal128
- Redis for caching and session state (planned)
- Elasticsearch for search and analytics indexing (planned)

## Security Controls

- Spring Security and OAuth2
- JWT-based access control
- 2FA and SSO via Google/Microsoft
- Audit logging and encryption at rest/in transit
- Rate limiting, CSRF protection, XSS hardening, and input validation
