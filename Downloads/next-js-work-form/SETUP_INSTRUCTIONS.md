# Admin Dashboard Setup Instructions

## Prerequisites

1. Install required packages:
```bash
npm install mongodb bcryptjs @types/bcryptjs
```

## Environment Variables

Create a `.env.local` file in the root directory with the following:

```
MONGODB_URI=mongodb+srv://work:<db_password>@cluster0.pr2y1rj.mongodb.net/?appName=Cluster0
JWT_SECRET=your-secret-key-change-in-production
```

**Important:** Replace `<db_password>` with your actual MongoDB password.

## Features Created

1. **Admin Signup** (`/admin/signup`)
   - Create new admin accounts
   - Email validation
   - Password hashing with bcrypt

2. **Admin Login** (`/admin/login`)
   - Secure authentication
   - Session management with cookies
   - Redirects to dashboard on success

3. **Admin Dashboard** (`/admin`)
   - Protected route (requires authentication)
   - Sidebar navigation
   - Employee management section
   - Logout functionality

4. **Employee Page** (`/admin/employees`)
   - View and manage employees
   - First navigation item in sidebar as requested

## API Routes

- `POST /api/admin/signup` - Create admin account
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/me` - Get current admin info

## Database

The admin data is stored in MongoDB:
- Database: `workform`
- Collection: `admins`

## Next Steps

1. Install the packages: `npm install mongodb bcryptjs @types/bcryptjs`
2. Set up your `.env.local` file with MongoDB connection string
3. Start the development server: `npm run dev`
4. Visit `/admin/signup` to create your first admin account
5. Login at `/admin/login` and access the dashboard

