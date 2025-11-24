# 🎨 Phase 3: Frontend Foundation Implementation Plan

**Objective**: Build the core structure of the `apps/web` application, ensuring a solid foundation for the Chat interface.
**Theme**: `shadcn/ui` (Green).
**Tech Stack**: Next.js 15 (App Router), TailwindCSS, Supabase Auth, TanStack Query, Zustand.

## 1. Configuration & Integration (The "Glue")

Although the basic Next.js app is initialized, we need to wire up the core libraries.

- [x] **Theme Configuration (Green)**
    - Update `components.json` or `globals.css` to use the **Green** color palette as the primary brand color.
    - Ensure Dark Mode is configured correctly in `tailwind.config.ts` (or v4 CSS).
- [x] **Supabase Client Setup**
    - Create `src/lib/supabase/client.ts` (Browser Client).
    - Create `src/lib/supabase/server.ts` (Server Client for Server Actions/SSR).
    - Create `src/lib/supabase/middleware.ts` (For route protection).
- [x] **State Management & Providers**
    - Create `src/providers/query-provider.tsx` (TanStack Query).
    - Create `src/providers/theme-provider.tsx` (Next-Themes).
    - Wrap `src/app/layout.tsx` with these providers.
    - Initialize `src/store/use-chat-store.ts` (Zustand) for managing chat state locally.

## 2. Authentication System

- [x] **Auth Pages**
    - Create `src/app/(auth)/login/page.tsx`.
    - Use **Magic Link** authentication (Email OTP) - no password required.
    - Create `src/app/auth/callback/route.ts` for handling Magic Link verification.
- [x] **Auth Protection**
    - Implement Middleware (`src/middleware.ts`) to redirect unauthenticated users to `/login`.
    - Ensure public routes (like Landing page if any) are accessible.

## 3. App Shell & Layout

- [x] **Main Layout (`src/app/(dashboard)/layout.tsx`)**
    - Create a persistent **Sidebar** for navigation and history.
    - Create a **Header** (Mobile only) for menu toggling.
    - Create the **Main Content Area** where the chat will live.
- [x] **Sidebar Component**
    - **New Chat** button (Primary Action).
    - **Navigation Links** (Chat, Notes, Settings).
    - **Recent History** list (Skeleton for now).
    - **User Profile** dropdown (Sign out).

## 4. UI Component Library (Shadcn)

Install and configure the necessary base components with the Green theme:

- [x] **Core Components**
    - `Button`, `Input`, `Textarea` (for chat input).
    - `Card`, `Avatar`, `Skeleton` (for loading states).
    - `DropdownMenu`, `Dialog` (modals).
    - `ScrollArea` (for chat history).
    - `Sheet` (for mobile sidebar).

## 5. ✅ Completion Status

**Phase 3 is COMPLETE!**

All tasks have been successfully implemented:
1.  ✅ Config: Green Theme & CSS variables configured
2.  ✅ Infra: Supabase clients & Query/Theme Providers set up
3.  ✅ Components: Base shadcn components installed
4.  ✅ Auth: Magic Link login implemented with callback route
5.  ✅ Layout: Responsive Sidebar & Dashboard Shell built

**Key Implementation Notes:**
- Authentication uses **Magic Link** (email OTP) instead of password - simpler and more secure
- No separate signup page needed - users are auto-created on first login
- Theme uses **Green** as primary color with full dark mode support
- All routes are protected by middleware except `/login` and `/auth/*`
