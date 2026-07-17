# Timesheet Feature - Quick Testing Guide

## Implementation Complete ✅

All backend services, controllers, DTOs, schemas, and frontend UI components have been successfully implemented.

---

## Files Created & Modified Summary

### Backend Files Created (6 files)
1. `backend/src/timesheets/schemas/timesheet.schema.ts` - Data model
2. `backend/src/timesheets/dto/timesheet.dto.ts` - Request/response DTOs
3. `backend/src/timesheets/timesheets.service.ts` - Business logic
4. `backend/src/timesheets/timesheets.controller.ts` - API endpoints
5. `backend/src/timesheets/timesheets.module.ts` - NestJS module registration

### Backend Files Modified (1 file)
- `backend/src/app.module.ts` - Added TimesheetsModule import and schema registration

### Frontend Files Modified (4 files)
- `js/api.js` - Added 20+ API client methods
- `js/modules.js` - Added timesheet UI rendering functions
- `js/store.js` - Added localStorage management for timesheet data
- `js/app.js` - Added event handlers and missed punch-out detection

---

## Quick Start: Running the Application

### 1. Start Backend
```bash
cd backend
npm install  # If not already done
npm run start:dev
```

### 2. Open Frontend
```bash
# Open index.html in browser at http://localhost:3000
# Or serve with: npx http-server
```

### 3. Login
- Use any valid employee credentials created in the system
- Or use seed data if available

---

## Key Features to Test

### ✅ Feature 1: Personal Timesheet Workflow
**Test Steps:**
1. Login as employee
2. Navigate to "Timesheet" tab
3. Click "Punch In" → system records timestamp, status = "Working"
4. Click "+ Add Activity" → enter activity and hours
5. Repeat step 4 to add more activities
6. Observe "Total Activity Hours" auto-calculation
7. Click "Punch Out" → system records timestamp, status = "Punched Out"
8. Click "Submit Timesheet" → status = "Submitted", becomes read-only
9. View history in "Timesheet History" section

### ✅ Feature 2: Activity Management
**Test Steps:**
1. While punched in, add multiple activities
2. Click "Edit" on an activity → modify and save
3. Click "Delete" on an activity → confirm deletion
4. Verify total hours recalculate automatically
5. Cannot edit/delete after submission (buttons disabled)

### ✅ Feature 3: Missed Punch-Out Detection
**Test Steps (Requires manual DB modification):**
1. Using MongoDB, update a timesheet to have `punchInTime` but no `punchOutTime`
2. Login next day or use same day after clearing local storage
3. Navigate to Timesheet tab
4. Warning modal appears asking for missed punch-out time
5. Enter the missed punch-out time
6. Modal closes, timesheet updates with punch-out timestamp
7. Can now edit activities and submit previous day's timesheet

### ✅ Feature 4: Reporting Manager - Team Timesheets
**Test Steps:**
1. Login as reporting_manager role
2. Navigate to "Timesheet" tab → shows personal timesheet
3. In Timesheet History section, view submitted timesheets
4. For submitted employee timesheets, click "View" → opens detail modal
5. See employee name, punch times, activities, total hours
6. Cannot edit or approve (view-only)

### ✅ Feature 5: HR - Timesheet Management
**Test Steps:**
1. Login as hr_manager role
2. Navigate to "Timesheet" tab
3. See all employees' daily status in overview table
4. Use search box to filter employees by name
5. Click "History" on an employee → view their timesheet history
6. Select date range if available
7. Click on specific date → view detailed timesheet

---

## API Endpoints (for manual testing with curl or Postman)

### Setup: Get Bearer Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@example.com","password":"password"}'
# Response includes token
```

### Personal Timesheet
```bash
# Get today's timesheet
curl http://localhost:3001/api/timesheets/today \
  -H "Authorization: Bearer <TOKEN>"

# Punch In
curl -X POST http://localhost:3001/api/timesheets/punch-in \
  -H "Authorization: Bearer <TOKEN>"

# Punch Out
curl -X POST http://localhost:3001/api/timesheets/punch-out \
  -H "Authorization: Bearer <TOKEN>"

# Add activity
curl -X POST http://localhost:3001/api/timesheets/activities \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"activity":"Designed UI","duration":2}'

# Submit timesheet
curl -X POST http://localhost:3001/api/timesheets/submit \
  -H "Authorization: Bearer <TOKEN>"

# Get history
curl http://localhost:3001/api/timesheets/history?limit=30 \
  -H "Authorization: Bearer <TOKEN>"
```

### Team Timesheets (Reporting Manager)
```bash
# Get team timesheets
curl http://localhost:3001/api/timesheets/team \
  -H "Authorization: Bearer <TOKEN>"

# Get specific employee timesheet
curl http://localhost:3001/api/timesheets/team/EMP123/2026-07-13 \
  -H "Authorization: Bearer <TOKEN>"
```

### Timesheet Management (HR)
```bash
# Get all employees' timesheets (today)
curl http://localhost:3001/api/timesheets/team \
  -H "Authorization: Bearer <TOKEN>"

# Get employee history
curl http://localhost:3001/api/timesheets/manage/employee/EMP123 \
  -H "Authorization: Bearer <TOKEN>"

# Get employee history with filters
curl "http://localhost:3001/api/timesheets/manage/employee/EMP123?fromDate=2026-07-01&toDate=2026-07-31&page=1&limit=30" \
  -H "Authorization: Bearer <TOKEN>"

# Get specific daily detail
curl http://localhost:3001/api/timesheets/manage/employee/EMP123/2026-07-13 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Expected Status Codes & Responses

### Success (200 OK)
```json
{
  "_id": "...",
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "date": "2026-07-13",
  "punchInTime": "2026-07-13T09:00:00.000Z",
  "punchOutTime": "2026-07-13T17:00:00.000Z",
  "punchOutSource": "System",
  "status": "Submitted",
  "activities": [
    {"activity": "Designed UI", "duration": 2},
    {"activity": "Code Review", "duration": 1.5}
  ],
  "submitted": true,
  "submittedAt": "2026-07-13T17:30:00.000Z",
  "punchedInDuration": 8,
  "totalActivityHours": 3.5
}
```

### Bad Request (400)
```json
{
  "message": "You have already punched in today"
}
```

### Unauthorized (401)
```json
{
  "message": "Invalid or expired token"
}
```

### Forbidden (403)
```json
{
  "message": "Access denied for your role"
}
```

---

## Data Validation Rules (Backend)

✅ **Enforced:**
- One timesheet per user per day (unique compound index)
- Activity duration must be ≥ 0.5 hours
- Punch-out only after punch-in
- Submit only after punch-out
- No duplicate punch-ins
- Manual punch-out only for previous day's missed punch-out
- Authenticated user identity used (not trusting user input)
- Role-based access on all endpoints

---

## Database Schema Reference

### Timesheet Collection
```
Indexes:
- Compound: { employeeId: 1, date: 1 } [UNIQUE]
- Single: { employeeId: 1 }
- Single: { date: 1 }

Fields:
- employeeId (string, required, indexed)
- date (string, required, indexed, format: YYYY-MM-DD)
- punchInTime (Date, optional)
- punchOutTime (Date, optional)
- punchOutSource (enum: 'System', 'Manual', default: 'System')
- status (enum: 'Not Punched In', 'Working', 'Punch Out Missing', 'Punched Out', 'Submitted')
- activities (array of subdocuments)
  - activity (string)
  - duration (number)
- submitted (boolean, default: false)
- submittedAt (Date, optional)
- reportingManagerId (ObjectId, optional reference to Employee)
- createdAt (Date, timestamp)
- updatedAt (Date, timestamp)
```

---

## Common Issues & Troubleshooting

### Issue: "Cannot connect to backend"
**Solution:** 
- Ensure MongoDB is running
- Backend is running: `npm run start:dev` in `backend/` directory
- Check `http://localhost:3001/api/health` is responding

### Issue: "You have already punched in today"
**Solution:** 
- This is correct behavior - only one punch-in per day allowed
- User must punch-out first before logging out
- Clear localStorage if testing multiple scenarios: `localStorage.clear()`

### Issue: "Cannot find employee"
**Solution:**
- Employee record must exist in `employees` collection
- Ensure employee has valid `employeeId` field
- User and Employee are linked by `employeeId`

### Issue: Missed punch-out modal not appearing
**Solution:**
- Manually create incomplete timesheet in MongoDB:
  ```json
  {
    "employeeId": "EMP001",
    "date": "2026-07-12",
    "punchInTime": new Date("2026-07-12T09:00:00Z"),
    "status": "Working"
  }
  ```
- Clear browser localStorage: `localStorage.clear()`
- Login and navigate to Timesheet

### Issue: Activities not saving
**Solution:**
- User must be punched in first
- Duration must be a valid number ≥ 0.5
- Frontend validation shows error message
- Check browser console for API errors

---

## Role Testing Checklist

### Admin / HR Manager
- [ ] Can access personal timesheet
- [ ] Can punch in/out
- [ ] Can add/edit/delete activities
- [ ] Can submit timesheet
- [ ] Can view all employees' timesheets
- [ ] Can search employees
- [ ] Can view timesheet history with filters
- [ ] Cannot edit other employees' timesheets

### Reporting Manager
- [ ] Can access personal timesheet
- [ ] Can punch in/out
- [ ] Can add/edit/delete activities
- [ ] Can submit timesheet
- [ ] Can view direct-report employees' submitted timesheets
- [ ] Cannot view employees not reporting to them
- [ ] Cannot edit team members' timesheets

### Employee / Project Manager
- [ ] Can access personal timesheet
- [ ] Can punch in/out
- [ ] Can add/edit/delete activities
- [ ] Can submit timesheet
- [ ] Cannot view other employees' timesheets
- [ ] Cannot access team timesheets section

---

## Performance Considerations

- **Data Fetching:** Timesheet history limited to 30 records by default
- **Pagination:** HR timesheet history uses pagination (page size: 30)
- **Search:** Client-side filtering on HR overview (real-time)
- **Caching:** Browser localStorage reduces API calls
- **Compound Index:** Database ensures fast lookups by (employeeId, date)

---

## Documentation Files

1. **[TIMESHEET_IMPLEMENTATION.md](./TIMESHEET_IMPLEMENTATION.md)** - Complete implementation details
2. **[QUICK_START.md](./QUICK_START.md)** (this file) - Testing and quick reference

---

## Support & Contact

For issues or questions about the implementation, refer to:
- Backend code: `backend/src/timesheets/`
- Frontend code: `js/api.js`, `js/modules.js`, `js/app.js`, `js/store.js`
- Database schema: MongoDB `timesheets` collection

---

**Status:** ✅ Implementation Complete - Ready for Testing
