# PMS - Productivity Management System

A multi-tenant SaaS web application for daily productivity tracking.

## Features

- **Multi-Tenancy**: Each tenant has isolated data with customizable user licenses
- **User Roles**: Platform Admin, Tenant Admin, and End User
- **Daily Workflow**:
  - Start of Day: Create tasks with optional categories
  - During Day: View and mark tasks as complete
  - End of Day: Review incomplete tasks with failure reasons (mandatory flow)
- **Failure Reasons**: Tenant Admin can manage failure reasons
- **Reporting**: Dashboard with productivity metrics and failure breakdowns

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Clean architecture with modular controllers

### Frontend
- React with Vite
- Tailwind CSS for styling
- PWA support for offline capability
- Zustand for state management

## Database Schema

See `backend/migrations/001_create_schema.sql` for the complete database schema.

### Tables:
- `tenants` - Tenant organizations with license limits
- `users` - Users with roles (platform_admin, tenant_admin, user)
- `day_entries` - Daily task tracking entries
- `tasks` - Individual tasks
- `failure_reasons` - Reasons for incomplete tasks
- `task_results` - Links tasks to failure reasons and notes

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd PMS
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables**

Create a `.env` file in the `backend` directory:
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pms
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

5. **Set up the database**
```bash
# Create the database
createdb pms

# Run the migration
psql -U postgres -d pms -f backend/migrations/001_create_schema.sql

# Seed the database with demo data
cd backend
node src/seeds.js
```

### Running the Application

**Start the backend server:**
```bash
cd backend
npm start
```

The backend will run on `http://localhost:5000`

**Start the frontend development server:**
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

## Demo Credentials

After running the seed script:

- **Platform Admin**: `platform@admin.com` / `password123`
- **Tenant Admin**: `admin@example.com` / `password123`
- **User**: `alice@example.com` / `password123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user

### Platform Admin (no tenant header required)
- `GET /api/platform/tenants` - List all tenants
- `POST /api/platform/tenants` - Create new tenant
- `GET /api/platform/tenants/:id` - Get tenant details
- `PUT /api/platform/tenants/:id` - Update tenant
- `DELETE /api/platform/tenants/:id` - Delete tenant

### Tenant Routes (requires `x-tenant-id` header)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:userId` - Get user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user
- `GET /api/day-entries/today` - Get today's day entry
- `POST /api/day-entries` - Create day entry
- `PUT /api/day-entries` - Update day entry
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Delete task
- `GET /api/failure-reasons` - List failure reasons
- `POST /api/failure-reasons` - Create failure reason
- `PUT /api/failure-reasons/:reasonId` - Update failure reason
- `DELETE /api/failure-reasons/:reasonId` - Delete failure reason
- `GET /api/reports/tenant-stats` - Get tenant statistics

## Project Structure

```
PMS/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth and tenant middleware
│   │   ├── routes.js         # API routes
│   │   ├── db.js             # Database connection
│   │   ├── seeds.js          # Database seeding
│   │   └── server.js         # Main server file
│   └── migrations/           # Database migrations
└── frontend/
    ├── src/
    │   ├── components/       # Reusable components
    │   ├── pages/            # Page components
    │   ├── store/            # State management
    │   └── main.jsx          # App entry point
    └── public/               # Static assets
```

## License

MIT