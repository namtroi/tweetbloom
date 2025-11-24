# 🎨 Phase 3: Frontend Foundation Implementation Plan

**Objective**: Build the core structure of the `apps/web` application, ensuring a solid foundation for the Chat interface.
**Theme**: `shadcn/ui` (Green).
**Tech Stack**: Next.js 15 (App Router), TailwindCSS, Supabase Auth, TanStack Query, Zustand.

## 1. Configuration & Integration (The "Glue")

Although the basic Next.js app is initialized, we need to wire up the core libraries.

- [ ] **Theme Configuration (Green)**
    - Update `components.json` or `globals.css` to use the **Green** color palette as the primary brand color.
    - Ensure Dark Mode is configured correctly in `tailwind.config.ts` (or v4 CSS).
- [ ] **Supabase Client Setup**
    - Create `src/lib/supabase/client.ts` (Browser Client).
    - Create `src/lib/supabase/server.ts` (Server Client for Server Actions/SSR).
    - Create `src/lib/supabase/middleware.ts` (For route protection).
- [ ] **State Management & Providers**
    - Create `src/providers/query-provider.tsx` (TanStack Query).
    - Create `src/providers/theme-provider.tsx` (Next-Themes).
    - Wrap `src/app/layout.tsx` with these providers.
    - Initialize `src/store/use-chat-store.ts` (Zustand) for managing chat state locally.

## 2. Authentication System

- [ ] **Auth Pages**
    - Create `src/app/(auth)/login/page.tsx`.
    - Create `src/app/(auth)/signup/page.tsx` (optional, can be combined).
    - Use `AuthForm` component (custom UI using shadcn components, NOT the pre-built Supabase UI widget for better control/theming).
- [ ] **Auth Protection**
    - Implement Middleware (`src/middleware.ts`) to redirect unauthenticated users to `/login`.
    - Ensure public routes (like Landing page if any) are accessible.

## 3. App Shell & Layout

- [ ] **Main Layout (`src/app/(dashboard)/layout.tsx`)**
    - Create a persistent **Sidebar** for navigation and history.
    - Create a **Header** (Mobile only) for menu toggling.
    - Create the **Main Content Area** where the chat will live.
- [ ] **Sidebar Component**
    - **New Chat** button (Primary Action).
    - **Navigation Links** (Chat, Notes, Settings).
    - **Recent History** list (Skeleton for now).
    - **User Profile** dropdown (Sign out).

## 4. UI Component Library (Shadcn)

Install and configure the necessary base components with the Green theme:

- [ ] **Core Components**
    - `Button`, `Input`, `Textarea` (for chat input).
    - `Card`, `Avatar`, `Skeleton` (for loading states).
    - `DropdownMenu`, `Dialog` (modals).
    - `ScrollArea` (for chat history).
    - `Sheet` (for mobile sidebar).
    - `Toast` (for notifications).

## 5. Execution Order

1.  **Config**: Update Theme & CSS variables.
2.  **Infra**: Set up Supabase & Query Providers.
3.  **Components**: Install base shadcn components.
4.  **Auth**: Build Login page & Middleware.
5.  **Layout**: Build Sidebar & Dashboard Shell.
