# Challenge API

REST API for authentication and order management with services, built with Node.js, TypeScript, and MongoDB.

## Stack

- Node.js + TypeScript
- Express 5
- MongoDB + Mongoose
- Zod (validation)
- JWT (authentication)
- Vitest (tests)

## Requirements

- Node.js 18+
- MongoDB local or remote

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Configure the environment:

```bash
copy .env.example .env
```

3. Run the API in dev mode:

```bash
npm run dev
```

## Scripts

- `npm run dev`: hot reload with nodemon
- `npm run build`: TypeScript build
- `npm run start`: runs `dist/index.js`
- `npm run test`: vitest watch mode
- `npm run test:run`: tests in run mode
- `npm run test:coverage`: coverage report
- `npm run lint`: lint with ESLint
- `npm run format`: format with Prettier

## HTTP files

You can test the API using the `.http` files in `src/tests/http` (for example, `auth.http` and `order.http`).  
Open them in your IDE and run the requests directly (VS Code with the REST Client extension).

## Environment variables

Base file: `.env.example`:

- `NODE_ENV` (`development` | `production` | `test`)
- `PORT`
- `MONGO_URI`
- `MONGO_DB_PRODUCTION`
- `MONGO_DB_DEVELOPMENT`
- `MONGO_DB_TEST`
- `JWT_SECRET`
- `JWT_EXPIRES_IN_MINUTES`
- `JWT_ALGORITHM`
- `PASSWORD_SALT`
- `PASSWORD_SECRET`

## API

Base URL: `http://localhost:3000/api`

### Auth

- `POST /auth/register`

```json
{ "email": "user@email.com", "password": "12345678" }
```

- `POST /auth/login`

```json
{ "email": "user@email.com", "password": "12345678" }
```

Response (both):

```json
{ "token": "jwt", "user": { "id": "...", "email": "..." } }
```

### Orders (protected)

Header: `Authorization: Bearer <token>`

- `POST /orders`

```json
{
  "labName": "Lab A",
  "patientName": "Patient",
  "clinicName": "Clinic",
  "expiresAt": "2026-01-01T00:00:00.000Z",
  "services": [{ "name": "Service 1", "value": 120 }]
}
```

- `GET /orders?stage=created&page=1&limit=50`
- `GET /orders/:orderId`
- `PUT /orders/:orderId`
- `POST /orders/:orderId/advance`
- `POST /orders/:orderId/services`
- `PUT /orders/:orderId/services/:serviceId`

## Structure

- `src/app.ts`: Express setup and routes
- `src/index.ts`: server bootstrap and MongoDB connection
- `src/modules`: auth, orders, and users modules
- `src/database`: models and MongoDB connection
