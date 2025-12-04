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

## Database Setup
- Start PostgreSQL
- Create database ```CREATE DATABASE flash_sale;```
- Run seed : ```npm run seed```

## Running 
- Development: ```npm run start:dev```
- Production: ```npm run build && npm run start:prod```

## API Endpoints
- GET /products - List all products
- GET /products/:id - Single product details
- POST /reservations - Create reservation
- POST /reservations/:id/complete - Complete purchase
- GET /reservations - All reservation
- GET /reservations/active - Get active reservations
- Get - /reservations/:id - Single reservation details


# Flash Sale Frontend
```markdown
## Prerequisites
- Node.js 18+
- Backend running on port 3000

## Installation
1. Navigate to frontend: `cd frontend`
2. Install dependencies: `npm install`

## Environment Configuration
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000