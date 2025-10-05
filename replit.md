# HomesApp - Real Estate Property Management Platform

## Overview

HomesApp is a comprehensive real estate property management SaaS platform designed for various user roles (master, admin, sellers, owners, management, concierge, and service providers). It facilitates property management, appointment scheduling, client presentation card creation, service coordination, and offer processing. The platform emphasizes role-based access control, integrates with Google Calendar, features a service provider marketplace, and includes a full backoffice for offer management. Its UI is a professional, data-dense dashboard supporting both light and dark modes, inspired by modern SaaS applications, and aims for market potential through streamlined real estate operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript.
- Vite for building and development.
- Wouter for client-side routing.
- TanStack Query for server state management.

**UI Component System:**
- Radix UI primitives for accessibility.
- Shadcn/ui with "new-york" style.
- Tailwind CSS for utility-first styling with custom design tokens.
- Class Variance Authority (CVA) for component variants.
- Light/dark theme support using CSS custom properties.

**Design System:**
- Professional color palette optimized for real estate.
- Custom HSL-based color tokens.
- Inter font for primary text, JetBrains Mono for monospace.
- Elevation system with layered shadows.

**State Management:**
- React Query for async state and API caching.
- Local React state for UI concerns.
- Custom hooks for reusable logic.
- Dedicated `useAuth` hook for authentication state.

### Backend Architecture

**Runtime & Framework:**
- Node.js with Express.js for RESTful API.
- TypeScript with ESM modules.
- Session-based authentication using Replit Auth (OpenID Connect).
- PostgreSQL session store.

**API Design:**
- RESTful endpoints.
- Role-based middleware for authorization across all user types.
- Consistent error handling with HTTP status codes.
- JSON request/response format.

**Authentication & Authorization:**
- **Triple Authentication System:**
  1.  **Public User Registration & Local Auth:** Email/password with bcrypt, email verification via Resend, and admin approval workflow for user status and role requests. Default role "cliente".
  2.  **Admin Local Auth:** Separate `admin_users` table with bcrypt-hashed passwords for administrator access.
  3.  **Replit Auth:** OpenID Connect for OAuth-based user authentication.
- Unified `isAuthenticated` and `requireRole` middlewares normalize identity across all authentication types, creating a consistent `req.user` structure.
- Role-based access control enforced at the route level.
- Admin role switching feature for testing.

### Data Storage

**Database:**
- PostgreSQL via Neon serverless platform.
- Drizzle ORM for type-safe queries and migrations.

**Schema Design:**
- User management with `userRoleEnum` and `userStatusEnum`.
- Separate `admin_users` table for local admin authentication.
- Flexible property statuses (rent, sale, rented, sold, inactive).
- Appointments, presentation cards, service providers, and offer workflows.
- Property staff assignments.
- Audit logs for tracking critical user actions.
- Session storage for both Replit Auth and admin authentication.

**Data Relationships:**
- Standard one-to-many and many-to-many relationships (e.g., users to properties, properties to staff).
- Hierarchical permissions for fine-grained access control.

## External Dependencies

**Third-Party Services:**
- **Google Calendar API**: For automated Google Meet event creation and calendar management, using OAuth2.
- **Resend API**: For email verification during local user registration.

**Database Provider:**
- **Neon Database**: Serverless PostgreSQL with WebSocket support.

**Authentication:**
- **Replit Auth**: OpenID Connect provider for user authentication.

**Development Tools:**
- **Replit Platform Plugins**: For development experience enhancements (e.g., error modal, code cartographer).

**UI Libraries:**
- **Radix UI**: Primitive component library.
- **Lucide React**: Icon library.
- **date-fns**: Date manipulation.
- **react-day-picker**: Calendar component.

**Type Safety & Validation:**
- **Zod**: Runtime type validation and schema definition.
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas.