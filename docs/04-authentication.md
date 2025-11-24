# Authentication System

## Overview
TweetBloom uses **Magic Link** authentication powered by Supabase Auth. This provides a passwordless, secure login experience.

## User Flow

### Login Process
1. User navigates to `/login`
2. User enters their email address
3. System sends a Magic Link to the email (via Supabase)
4. User clicks the link in their email
5. System verifies the link via `/auth/callback` route
6. User is redirected to the Dashboard (`/`)

### Auto-Signup
- If the email doesn't exist in the system, a new user account is automatically created
- No separate signup page is needed
- Users can start using the app immediately after email verification

## Technical Implementation

### Components
- **Login Page**: `apps/web/src/app/(auth)/login/page.tsx`
- **Auth Form**: `apps/web/src/components/auth-form.tsx`
- **Callback Route**: `apps/web/src/app/auth/callback/route.ts`

### Supabase Clients
- **Browser Client**: `apps/web/src/lib/supabase/client.ts` - Used in client components
- **Server Client**: `apps/web/src/lib/supabase/server.ts` - Used in server components and API routes
- **Middleware Helper**: `apps/web/src/lib/supabase/middleware.ts` - Handles session refresh

### Route Protection
- **Middleware**: `apps/web/src/middleware.ts`
- Protected routes: All routes except `/login` and `/auth/*`
- Unauthenticated users are redirected to `/login`

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Email Templates
Customize the Magic Link email in Supabase Dashboard:
- Navigate to **Authentication** → **Email Templates**
- Edit the "Magic Link" template
- Recommended subject: "Login to TweetBloom"
