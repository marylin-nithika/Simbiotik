# HRMS Portal — Simbiotik

Full-stack HR Management System with role-based access. All data is stored in **MongoDB** — no demo/seed data is loaded automatically.

## Project Structure

```
hrms-portal/
├── index.html          # Frontend (open in browser)
├── js/                 # Frontend app
├── css/
└── backend/            # NestJS API + MongoDB
```

## How to Start Backend & Database

### Step 1 — Install and start MongoDB

1. Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) or use MongoDB Compass (includes mongod).
2. Start MongoDB on **`localhost:27017`** (default port).
3. The database **`hrms-simbiotik`** is created automatically when the backend starts.

**View/edit data in MongoDB Compass:**
- Open Compass → Connect to `mongodb://127.0.0.1:27017`
- Select database **`hrms-simbiotik`**
- Collections: `users`, `employees`, `leaves`, `jobs`, `candidates`, `payrolls`, `performances`

**Clear all existing data (if you had old seed data):**
```bash
mongosh hrms-simbiotik --eval "db.dropDatabase()"
```

### Step 2 — Start the NestJS backend

```bash
cd backend
npm install
npm run start:dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3001/api | REST API |
| http://localhost:3001/api/docs | Swagger UI (test all endpoints) |
| http://localhost:3001/api/health | Health check |

### Step 3 — Open the frontend

Open `index.html` in your browser, or from the project root:

```bash
npx serve .
```

---

## First-time setup (no dummy data)

Because seed data is disabled, you must create your own accounts.

### Option A — Create first admin via Swagger

1. Start backend and open http://localhost:3001/api/docs
2. Call **`POST /auth/register`** (only works when the database has **zero** users):

```json
{
  "email": "admin@simbiotiktech.com",
  "password": "yourpassword",
  "name": "Admin User",
  "role": "admin",
  "employeeId": "SG00001"
}
```

3. Also add the employee record via **`POST /employees`** (use the same employeeId).

### Option B — Add data directly in MongoDB Compass

Insert documents into `users` and `employees` collections. Passwords in `users` must be bcrypt-hashed (use Swagger register instead).

### Creating more login accounts

After logging in as Admin or HR, use **`POST /auth/users`** in Swagger to create portal logins for employees (or set a password when onboarding via the **+ Onboard Employee** form in the UI).

---

## Features

- **Leave requests** — 3 approval stages: HR → Project Manager → Admin (each shows Pending / Approved / Rejected)
- **Employee onboarding** — full form: SG00 ID, @simbiotiktech.com, Gmail, PAN, Aadhaar, supervisor, education, experience, passport, assets
- Job postings with PDF upload
- Recruitment pipeline (HR only)
- Payroll in ₹
- Performance goals + manager feedback

See `backend/README.md` for full API documentation.
