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
2. Build the containers:
   - docker compose -f docker/docker-compose.yml up --build
3. Open the frontend at http://localhost:3000
4. Open the API health endpoint at http://localhost:8080/api/health
5. Open the AI health endpoint at http://localhost:8000/health

## Roadmap

- Authentication and RBAC
- CRM and sales workflow modules
- Inventory and finance modules
- Marketplace storefront
- AI assistant and forecasting services
- Real-time collaboration and notifications
