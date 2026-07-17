# Daily Activity Timesheet Feature - Implementation Summary

## Overview
A comprehensive Daily Activity Timesheet feature has been successfully implemented for the HRMS portal, allowing employees, managers, and HR to track daily work activities with automatic punch-in/out timestamps.

---

## Files Created

### Backend

#### 1. **Database Schema**
- **File:** `backend/src/timesheets/schemas/timesheet.schema.ts`
- **Purpose:** Mongoose schema for Timesheet documents
- **Key Fields:**
  - `employeeId`, `employeeName`, `email`: User identification
  - `date`: Timesheet date (unique per user per day)
  - `punchInTime`, `punchOutTime`: Automatic timestamps
  - `punchOutSource`: 'System' or 'Manual' (for missed punch-out)
  - `status`: 'Not Punched In', 'Working', 'Punch Out Missing', 'Punched Out', 'Submitted'
  - `activities`: Array of TimesheetActivity objects (activity + duration)
  - `reportingManagerId`: Reference to reporting manager
  - Unique compound index: `{ employeeId: 1, date: 1 }`

#### 2. **Data Transfer Objects (DTOs)**
- **File:** `backend/src/timesheets/dto/timesheet.dto.ts`
- **DTOs:**
  - `AddActivityDto`: activity (string) + duration (number)
  - `EditActivityDto`: index + activity + duration
  - `ResolveMissedPunchOutDto`: missedPunchOutTime
  - `SubmitTimesheetDto`: Empty (submission is explicit action)

#### 3. **Service Layer**
- **File:** `backend/src/timesheets/timesheets.service.ts`
- **Core Methods:**
  - `punchIn()`: Create/update timesheet with punch-in timestamp
  - `punchOut()`: Record punch-out timestamp, set status to 'Punched Out'
  - `addActivity()`: Add activity entry to today's timesheet
  - `editActivity()`: Update specific activity by index
  - `deleteActivity()`: Remove activity by index
  - `submitTimesheet()`: Final submission (requires punch-out)
  - `checkMissedPunchOut()`: Detect previous day's incomplete punch-in
  - `resolveMissedPunchOut()`: Manually set punch-out for previous day
  - `getTodayTimesheet()`: Get or create today's timesheet
  - `getMyTimesheets()`: Get user's historical timesheets
  - `getTeamTimesheets()`: Reporting manager's direct-report overview
  - `getTeamTimesheetDetail()`: View submitted employee timesheet
  - `getAllEmployeeTimesheets()`: HR's daily overview
  - `getEmployeeTimesheetHistory()`: HR's employee history with pagination
  - `getEmployeeTimesheetDetail()`: HR's detailed daily view
- **Helper Methods:**
  - `enrichTimesheetWithCalculations()`: Add computed fields (punchedInDuration, totalActivityHours)
  - Date/time formatting and duration calculations

#### 4. **Controller**
- **File:** `backend/src/timesheets/timesheets.controller.ts`
- **Endpoints:**
  - `GET /timesheets/today` - Get today's timesheet
  - `GET /timesheets/missed-punch-out` - Check for missed punch-out
  - `POST /timesheets/punch-in` - Punch in
  - `POST /timesheets/punch-out` - Punch out
  - `POST /timesheets/activities` - Add activity
  - `PATCH /timesheets/activities/:index` - Edit activity
  - `PATCH /timesheets/activities/:index/delete` - Delete activity
  - `PATCH /timesheets/resolve-missed-punch-out/:timesheetId` - Resolve missed punch-out
  - `POST /timesheets/submit` - Submit timesheet
  - `GET /timesheets/history` - Get user's history
  - `GET /timesheets/team` - Team timesheets (reporting managers/HR)
  - `GET /timesheets/team/:employeeId/:date` - Team member detail
  - `GET /timesheets/manage/employee/:employeeId` - HR employee history
  - `GET /timesheets/manage/employee/:employeeId/:date` - HR daily detail
- **Authentication:** JwtAuthGuard (all endpoints)
- **Authorization:** RolesGuard with role-based access control

#### 5. **Module**
- **File:** `backend/src/timesheets/timesheets.module.ts`
- **Registers:** Controller, Service, and Schemas
- **Imports:** MongooseModule, Employee, User models

### Frontend

#### 6. **API Methods**
- **File:** `js/api.js`
- **Methods Added:**
  - `getTodayTimesheet()` - GET /timesheets/today
  - `checkMissedPunchOut()` - GET /timesheets/missed-punch-out
  - `punchIn()` - POST /timesheets/punch-in
  - `punchOut()` - POST /timesheets/punch-out
  - `addActivity()` - POST /timesheets/activities
  - `editActivity()` - PATCH /timesheets/activities/:index
  - `deleteActivity()` - PATCH /timesheets/activities/:index/delete
  - `resolveMissedPunchOut()` - PATCH /timesheets/resolve-missed-punch-out/:id
  - `submitTimesheet()` - POST /timesheets/submit
  - `getTimesheetHistory()` - GET /timesheets/history
  - `getTeamTimesheets()` - GET /timesheets/team
  - `getTeamTimesheetDetail()` - GET /timesheets/team/:employeeId/:date
  - `getEmployeeTimesheetHistory()` - GET /timesheets/manage/employee/:employeeId
  - `getEmployeeTimesheetDetail()` - GET /timesheets/manage/employee/:employeeId/:date

#### 7. **Store (Local State Management)**
- **File:** `js/store.js`
- **New Keys:**
  - `hrms_timesheet`: Current day's timesheet
  - `hrms_timesheet_history`: User's timesheet history
  - `hrms_team_timesheets`: Team timesheets (reporting managers)
  - `hrms_all_timesheets`: All employees' timesheets (HR)
- **Methods Added:**
  - `getTimesheet()`, `setTimesheet()`
  - `getTimesheetHistory()`, `setTimesheetHistory()`
  - `getTeamTimesheets()`, `setTeamTimesheets()`
  - `getAllTimesheets()`, `setAllTimesheets()`

#### 8. **Navigation & Routing**
- **File:** `js/modules.js`
- **Changes:**
  - Added timesheet icon SVG
  - Added 'timesheet' to ROLE_NAV for all roles (admin, hr_manager, employee, project_manager, reporting_manager)
  - Added PAGE_TITLES entry for 'timesheet'
  - Added to Modules.render() switch statement

#### 9. **UI Components**
- **File:** `js/modules.js`
- **Functions Added:**
  - `renderTimesheet()` - Main dispatcher
  - `renderTimesheetPersonal()` - Personal daily timesheet
  - `renderTimesheetPersonalAndTeam()` - Reporting manager view
  - `renderTeamTimesheets()` - Team overview (reporting managers)
  - `renderTimesheetManagement()` - HR employee overview
- **Features:**
  - Status badges with color coding
  - Punch In/Out buttons with state management
  - Activity table with Edit/Delete actions
  - Total duration calculations
  - Timesheet history with pagination
  - Search functionality for HR view

#### 10. **Event Handlers**
- **File:** `js/app.js`
- **Event Listeners for:**
  - `#btn-punch-in` - Trigger punch-in
  - `#btn-punch-out` - Trigger punch-out
  - `#btn-add-activity` - Show add activity modal
  - `#btn-submit-timesheet` - Submit timesheet with confirmation
  - `[data-edit-activity]` - Edit activity with modal
  - `[data-delete-activity]` - Delete activity with confirmation
  - `[data-view-team-timesheet]` - View submitted employee timesheet
  - `[data-view-employee-timesheet-history]` - View employee history
  - `#search-employee-ts` - Real-time search filtering

#### 11. **Missed Punch-Out Detection**
- **File:** `js/app.js`
- **Function:** `checkAndShowMissedPunchOut()`
- **Behavior:**
  - Automatically triggered when user opens Timesheet tab
  - Shows warning modal with previous day's punch-in time
  - Allows manual entry of missed punch-out time
  - Updates timesheet status after resolution
  - Blocks new punch-in until resolved

#### 12. **Data Sync**
- **File:** `js/app.js`
- **Updates to `syncFromApi()`:**
  - Fetches today's timesheet
  - Fetches timesheet history (30 records)
  - Fetches team timesheets (for reporting managers)
  - Fetches all timesheets (for HR)
  - Stores all data in Store

---

## Modified Files

### Backend
- **`backend/src/app.module.ts`**
  - Imported TimesheetsModule
  - Registered Timesheet schema in MongooseModule.forFeature()

### Frontend
- **`js/modules.js`**
  - Added timesheet icon
  - Added timesheet navigation entries
  - Added render functions for timesheet UI
- **`js/api.js`**
  - Added 20+ timesheet API methods
- **`js/store.js`**
  - Added KEYS for timesheet data
  - Added getter/setter methods
- **`js/app.js`**
  - Added checkAndShowMissedPunchOut() function
  - Added 400+ lines of timesheet event handlers
  - Updated syncFromApi() to fetch timesheet data
  - Updated render() to check for missed punch-outs

---

## Data Model

### Timesheet Document Structure
```typescript
{
  _id: ObjectId,
  employeeId: string (indexed),
  employeeName: string,
  email: string,
  date: string (indexed, format: YYYY-MM-DD),
  reportingManagerId?: ObjectId,
  punchInTime?: Date,
  punchOutTime?: Date,
  punchOutSource: 'System' | 'Manual' (default: 'System'),
  status: 'Not Punched In' | 'Working' | 'Punch Out Missing' | 'Punched Out' | 'Submitted',
  activities: [
    {
      activity: string,
      duration: number (hours)
    }
  ],
  submitted: boolean (default: false),
  submittedAt?: Date,
  createdAt: Date (timestamp),
  updatedAt: Date (timestamp)
}
```

### Unique Constraint
- Compound index on `{ employeeId: 1, date: 1 }` ensures one timesheet per user per day

---

## Timesheet Status Workflow

```
Not Punched In
    ↓
    └─→ [Punch In Button]
        ↓
    Working (Punched In)
        ├─→ [Add/Edit/Delete Activities]
        └─→ [Punch Out Button]
            ↓
        Punched Out
            ├─→ [Add/Edit/Delete Activities still allowed]
            └─→ [Submit Timesheet Button]
                ↓
            Submitted (Read-only)
```

### Missed Punch-Out Scenario
```
Previous Day: Working → [End of day, user forgets to punch out]
    ↓
Next Day: User opens Timesheet tab
    ↓
    └─→ [System detects: Punch In exists, Punch Out missing]
        ↓
    [Warning Modal appears]
        ↓
    [User enters missed Punch Out time]
        ↓
    punchOutSource = 'Manual'
    status = 'Punch Out Missing' → 'Punched Out'
        ↓
    [User can now review activities and submit]
        ↓
    [User can then punch in for current day]
```

---

## API Endpoints Summary

### Personal Timesheet (All Roles)
- `GET /timesheets/today` - Today's timesheet with status
- `GET /timesheets/missed-punch-out` - Check for previous day's incomplete punch-in
- `POST /timesheets/punch-in` - Start work
- `POST /timesheets/punch-out` - End work
- `POST /timesheets/activities` - Add activity
- `PATCH /timesheets/activities/:index` - Update activity
- `PATCH /timesheets/activities/:index/delete` - Remove activity
- `PATCH /timesheets/resolve-missed-punch-out/:timesheetId` - Fix missed punch-out
- `POST /timesheets/submit` - Submit timesheet
- `GET /timesheets/history?limit=30` - Get history (30 records)

### Team Timesheets (Reporting Managers Only)
- `GET /timesheets/team` - Direct-report employees' daily status
- `GET /timesheets/team/:employeeId/:date` - View submitted employee timesheet

### Timesheet Management (HR Only)
- `GET /timesheets/team` - All employees' daily overview
- `GET /timesheets/manage/employee/:employeeId` - Employee history with pagination
- `GET /timesheets/manage/employee/:employeeId/:date` - Daily detail

---

## Role-Based Access Control

### Employee
- **Personal Timesheet:** Full access (punch in/out, add/edit/delete activities, submit)
- **Others' Timesheets:** None

### Project Manager
- **Personal Timesheet:** Full access
- **Others' Timesheets:** None
- **Team View:** None

### Reporting Manager
- **Personal Timesheet:** Full access
- **Team Timesheets:** View-only (current day, direct reports only)
- **Cannot:** Edit, delete, or approve employee timesheets

### HR Manager / Admin
- **Personal Timesheet:** Full access
- **All Employee Timesheets:** View-only
- **Features:** Search, filter by employee, historical records with date ranges
- **Cannot:** Edit or delete employee timesheets

---

## Key Features Implemented

### ✅ Personal Timesheet Workflow
- Automatic punch-in/out timestamps (no manual entry in normal flow)
- Activity tracking with duration
- Real-time status display
- Submit-on-demand workflow
- Timesheet history view

### ✅ Missed Punch-Out Handling
- Automatic detection on next login
- Warning modal with previous day details
- Manual punch-out time entry (only for fixing missed punch-out)
- Marked as 'Manual' in punch-out source
- Prevents blocking current day's operations

### ✅ Team Timesheets (Reporting Managers)
- View direct-report employees' daily status
- See who submitted vs. not submitted
- Click to view submitted timesheets
- Current day focus (no historical browse)

### ✅ Timesheet Management (HR)
- Employee overview with daily status
- Search by employee name
- Historical records with date filtering
- Pagination support
- Detailed daily view with punch details

### ✅ Activity Management
- Activity field (free-text)
- Duration field (hours, e.g., 2, 2.5, 3)
- No description field (as per requirements)
- Edit before submission
- Delete before submission
- Total hours calculation

### ✅ Security & Validation
- JWT authentication on all endpoints
- Role-based access control on backend
- Authenticated user's identity used (not trusting user-provided IDs)
- One timesheet per user per day (database constraint)
- No multiple punch-ins per day
- Submission only after punch-out

### ✅ UI/UX
- Consistent with existing HRMS design
- Status badges with color coding
- Modal dialogs for forms
- Confirmation dialogs for destructive actions
- Toast notifications for feedback
- Responsive layout
- Search and filter functionality
- Pagination support

---

## How to Run and Test

### Prerequisites
1. **MongoDB** running on `localhost:27017` or set `MONGODB_URI` env variable
2. **Backend** running: `cd backend && npm run start:dev`
3. **Frontend** served at `http://localhost:3000` (or wherever your frontend is hosted)

### Testing the Feature

#### 1. **Login as Employee**
- Navigate to Timesheet tab
- Click "Punch In" - system records current timestamp
- Status changes to "Working"

#### 2. **Add Activities**
- Click "+ Add Activity"
- Enter activity: "Designed Timesheet UI"
- Enter duration: 2 hours
- Click "Add Activity"
- Repeat to add more activities
- Observe "Total Activity Hours" calculation

#### 3. **Edit/Delete Activities**
- Click "Edit" on an activity
- Modify activity text or duration
- Click "Delete" to remove an activity

#### 4. **Punch Out**
- Click "Punch Out" when leaving
- Punch-out timestamp is recorded
- Status changes to "Punched Out"
- Activities can still be edited

#### 5. **Submit Timesheet**
- After punch-out, click "Submit Timesheet"
- Confirm submission
- Timesheet becomes read-only
- Status changes to "Submitted"

#### 6. **Test Missed Punch-Out** (Requires Backend Data)
- Modify a timesheet in MongoDB to have punchInTime but no punchOutTime
- Log in next day or advance time
- Open Timesheet tab - warning modal appears
- Enter missed punch-out time
- Timesheet status updates to "Punch Out Missing" → "Punched Out"

#### 7. **Reporting Manager View**
- Login as reporting_manager user
- Open Timesheet tab
- View team's timesheets (direct reports only)
- Click "View" on submitted timesheets
- See submitted employee's daily details

#### 8. **HR View**
- Login as hr_manager user
- Open Timesheet tab
- See all employees' daily status
- Search by employee name
- Click employee to view history
- Select date to view details

---

## Architecture & Design Decisions

### Backend
- **NestJS Pattern:** Service-Controller separation for clean code
- **Mongoose Schema:** Compound unique index for data integrity
- **DTO Validation:** class-validator for input validation
- **Guards & Decorators:** JwtAuthGuard + RolesGuard for security
- **Calculated Fields:** punchedInDuration and totalActivityHours computed on read

### Frontend
- **Modular UI:** Separate render functions for different views
- **Event Delegation:** Data attributes for dynamic event binding
- **Local Storage:** Store caching for offline-first approach
- **Modal Dialogs:** Consistent form handling
- **Real-time Search:** Client-side filtering for quick UX

### Data Model
- **One Record Per Day:** Simple, enforced at database level
- **Activity Subdocuments:** Nested arrays for flexible activity tracking
- **Timestamp Tracking:** createdAt/updatedAt for audit trail
- **Punch-Out Source:** Distinguishes system-recorded vs. manually-corrected

---

## Scope Limitations (By Design)

❌ **Not Included (As Per Requirements):**
- Activity description field
- Projects or task assignments
- Clients or billing information
- Manager approval/rejection workflows
- GPS tracking or biometric integration
- Screenshots or monitoring
- Automatic punch-out at midnight
- Complex attendance regularization

✅ **Included (Core Feature):**
- Daily activity tracking
- Punch in/out with automatic timestamps
- Missed punch-out detection and correction
- Role-based views and access control
- Personal + team + organizational visibility
- Simple, focused feature set

---

## Files Checklist

### Backend
- ✅ `backend/src/timesheets/schemas/timesheet.schema.ts`
- ✅ `backend/src/timesheets/dto/timesheet.dto.ts`
- ✅ `backend/src/timesheets/timesheets.service.ts`
- ✅ `backend/src/timesheets/timesheets.controller.ts`
- ✅ `backend/src/timesheets/timesheets.module.ts`
- ✅ `backend/src/app.module.ts` (modified)

### Frontend
- ✅ `js/api.js` (modified)
- ✅ `js/modules.js` (modified)
- ✅ `js/store.js` (modified)
- ✅ `js/app.js` (modified)

---

## Next Steps & Enhancements (Future)

- **Export to CSV/PDF:** Timesheet reports
- **Bulk Actions:** HR bulk timesheet management
- **Reminders:** Notifications for pending punch-outs
- **Mobile App:** Native mobile client
- **Integrations:** Slack/Teams notifications
- **Analytics:** Dashboard with trends
- **Geolocation:** Optional location tracking
- **Camera:** Optional work proof (screenshots optional)
- **Approval Workflow:** Optional manager approval
- **Compliance Reports:** Regulatory reporting exports
