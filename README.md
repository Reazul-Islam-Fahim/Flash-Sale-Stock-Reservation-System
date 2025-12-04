# Flash Sale Stock Reservation System

## Overview
A full-stack system for reserving products during flash sales with 2-minute expiration timers.

## Tech Stack
- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, Bull Queue
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, React Query
- **Database**: PostgreSQL
- **Queue**: Redis with Bull
- **Container**: Docker & Docker Compose

## Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone repository
git clone <repository-url>
cd flash-sale-system

# Start all services
docker-compose up -d

# Seed database
docker exec flash_sale_backend npm run seed