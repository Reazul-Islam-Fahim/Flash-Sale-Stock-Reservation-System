# Flash Sale Backend

## Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

## Installation
1. Clone repository
2. Navigate to backend: `cd backend`
3. Install dependencies: `npm install`

## Environment Configuration
Create `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=flash_sale

REDIS_HOST=localhost
REDIS_PORT=6379

PORT=3000
NODE_ENV=development
```