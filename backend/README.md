# HRMS Simbiotik API

NestJS + MongoDB backend for the HRMS Portal frontend.

## Database

Creates and uses a **new MongoDB database**:

```
mongodb://127.0.0.1:27017/hrms-simbiotik
```

MongoDB auto-creates this database on first connection. Collections: `users`, `employees`, `leaves`, `jobs`, `candidates`, `payrolls`, `performance`, `feedbacks`.

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod` or MongoDB Compass / Atlas with URI in `.env`)

## Setup

```bash
cd backend
npm install
npm run start:dev
```

API: **http://localhost:3001/api**  
Swagger: **http://localhost:3001/api/docs**

## Demo Logins

| Email | Password | Role |
|-------|----------|------|
| sarah@company.com | emp123 | Employee |
| james@company.com | hr123 | HR Manager |
| maria@company.com | mgr123 | Manager |
| admin@company.com | admin123 | Admin |

## API Endpoints

| Method | Path | Access |
|--------|------|--------|
| GET | /api/health | Public |
| POST | /api/auth/login | Public |
| GET | /api/dashboard | Auth |
| GET/POST | /api/employees | POST: HR/Admin |
| GET/POST | /api/leaves | All auth |
| PATCH | /api/leaves/:id/status | HR/Admin/Manager |
| PATCH | /api/leaves/:id/approve | HR/Admin/Manager (step) |
| DELETE | /api/leaves/:id | Auth |
| GET/POST | /api/jobs | POST: HR/Admin + PDF |
| GET | /api/jobs/:id/pdf | Auth |
| GET/POST | /api/candidates | HR/Admin only |
| GET/POST | /api/payroll | POST: HR/Admin |
| GET | /api/payroll/:id/payslip | Auth |
| GET/POST | /api/performance | Manager+ |
| GET/POST | /api/performance/feedback | Manager posts, HR reads |

## Employee Validation

- Employee ID: `SG00xxx`
- Office mail: `@simbiotiktech.com`
- Personal email: `@gmail.com`
- PAN: `ABCDE1234F`
- Aadhaar: 12 digits
- UAN: 12 digits

## Re-seed Database

Drop the database in MongoDB Compass or:

```bash
mongosh hrms-simbiotik --eval "db.dropDatabase()"
```

Restart the server — seed runs automatically on empty DB.
