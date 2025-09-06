# NextAuth.js Backend Setup Guide

## 🚀 Authentication System Overview

This welfare project now includes a complete NextAuth.js authentication system with the following features:

### ✅ Features Implemented

1. **Database Models:**
   - Enhanced `Admin` model with roles and authentication fields
   - NextAuth required models (`Account`, `Session`, `VerificationToken`)
   - Role-based access control (SUPER_ADMIN, ADMIN, MODERATOR)

2. **Authentication:**
   - Credentials-based authentication
   - Password hashing with bcryptjs
   - Session management with JWT
   - Audit logging for security events

3. **API Endpoints:**
   - `/api/auth/[...nextauth]` - NextAuth main endpoints
   - `/api/auth/admins` - Admin management
   - `/api/auth/admins/[id]` - Individual admin operations
   - `/api/auth/change-password` - Password change

4. **Security Features:**
   - Route protection middleware
   - Role-based authorization
   - Session validation
   - CSRF protection
   - Audit trail

## 🔧 Setup Instructions

### 1. Generate Prisma Client
```bash
npm run db:generate
```

### 2. Run Database Migration
```bash
npm run db:migrate
```

### 3. Seed Database with Default Admin
```bash
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

## 🔑 Default Credentials

After seeding, you can login with:
- **Username:** `superadmin`
- **Email:** `admin@welfare.com`
- **Password:** `admin123`
- **Role:** `SUPER_ADMIN`

## 📊 Database Schema

### Admin Model
```prisma
model Admin {
  id        String    @id @default(uuid())
  username  String    @unique
  email     String?   @unique
  password  String
  name      String?
  image     String?
  role      AdminRole @default(ADMIN)
  isActive  Boolean   @default(true)
  lastLogin DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  MODERATOR
}
```

## 🛡️ Role Hierarchy

1. **MODERATOR** - Basic access
2. **ADMIN** - Can manage welfare programs and users
3. **SUPER_ADMIN** - Full system access, can manage other admins

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Admin Management (Super Admin only)
- `GET /api/auth/admins` - List all admins
- `POST /api/auth/admins` - Create new admin
- `GET /api/auth/admins/[id]` - Get admin details
- `PUT /api/auth/admins/[id]` - Update admin
- `DELETE /api/auth/admins/[id]` - Delete admin

### Profile Management
- `POST /api/auth/change-password` - Change password

## 🔐 Usage Examples

### Server-side Authentication
```typescript
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { AdminRole } from "@/types/next-auth";

// Require any authentication
const session = await requireAuth();

// Require specific role
const session = await requireRole(AdminRole.ADMIN);
```

### Client-side Authentication
```typescript
import { useAuth, useRole } from "@/hooks/useAuth";

const { user, isAuthenticated, isLoading } = useAuth();
const { hasRole } = useRole(AdminRole.ADMIN);
```

### Protected API Route
```typescript
import { withAuth } from "@/lib/auth-utils";
import { AdminRole } from "@/types/next-auth";

export const GET = withAuth(
  async (request) => {
    // Your protected logic here
    return NextResponse.json({ data: "protected" });
  },
  { requiredRole: AdminRole.ADMIN }
);
```

## 🛣️ Route Protection

The middleware automatically protects:
- `/admin/*` - Requires authentication
- `/admin/admin-management/*` - Requires SUPER_ADMIN
- `/admin/users-management/*` - Requires SUPER_ADMIN
- `/admin/welfare-management/*` - Requires ADMIN or higher
- `/api/admin/*` - Requires SUPER_ADMIN
- `/api/users/*` - Requires SUPER_ADMIN

## 🔧 Environment Variables

Make sure these are set in your `.env` file:
```env
DATABASE_URL="postgresql://welfare_user:welfare_password@localhost:5432/welfare_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-secret-change-this-in-production"
```

## 🧪 Testing the Setup

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Test authentication:**
   - Navigate to `/api/auth/signin`
   - Login with default credentials
   - Check session at `/api/auth/session`

3. **Test API endpoints:**
   ```bash
   # Get current session
   curl http://localhost:3000/api/auth/session

   # List admins (requires authentication)
   curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
        http://localhost:3000/api/auth/admins
   ```

## 🚨 Security Considerations

1. **Change default credentials** in production
2. **Update NEXTAUTH_SECRET** with a secure random string
3. **Use HTTPS** in production
4. **Configure proper CORS** settings
5. **Monitor audit logs** for security events

## 📈 Next Steps

1. Create sign-in/sign-up UI components
2. Add email verification (optional)
3. Implement password reset functionality
4. Add two-factor authentication (optional)
5. Create admin dashboard pages
6. Set up role-based navigation

## 🐛 Troubleshooting

### Common Issues:

1. **Database connection errors:**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env

2. **Authentication not working:**
   - Verify NEXTAUTH_SECRET is set
   - Check that cookies are enabled
   - Ensure NEXTAUTH_URL matches your domain

3. **Role permissions not working:**
   - Check middleware configuration
   - Verify role assignments in database
   - Check API route protection

4. **Session not persisting:**
   - Check cookie settings
   - Verify session strategy in auth config
   - Ensure secure flag is appropriate for environment

For more help, check the [NextAuth.js documentation](https://next-auth.js.org/).
