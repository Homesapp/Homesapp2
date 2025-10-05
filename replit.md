# HomesApp - Real Estate Property Management Platform

## Overview

HomesApp is a comprehensive SaaS platform designed for real estate property management. It supports multiple user roles (master, admin, sellers, owners, management, concierge, service providers) to manage properties, schedule appointments, create client presentations, coordinate services, and process offers. The platform features role-based access control, Google Calendar integration, a service provider marketplace, and a full back office for offer management. Its UI is a professional, data-dense dashboard with light/dark mode support, aiming to streamline property management operations and enhance user experience in the real estate sector.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React 18, TypeScript, and Vite. It uses Wouter for routing and TanStack Query for server state management. The UI is constructed with Radix UI primitives, Shadcn/ui components, and styled using Tailwind CSS with custom design tokens. It supports light/dark themes and utilizes a professional design system with the Inter and JetBrains Mono fonts.

### Backend

The backend uses Node.js with Express.js and TypeScript, enforcing ESM modules. It provides a RESTful API with role-based middleware for authorization and consistent JSON-based error handling. A unique dual authentication system is implemented: Replit Auth (OpenID Connect) for regular users and local username/password authentication for administrators. This system includes session management, user approval workflows, and an admin role-switching feature for testing.

### Data Storage

The application uses PostgreSQL (via Neon serverless platform) and Drizzle ORM for type-safe database interactions. The schema supports user management with role-based permissions, flexible property statuses, appointment scheduling, client presentation cards, service providers, offer workflows, and staff assignments. Audit logs are implemented for tracking critical user actions.

**Lead Capture System (Phase A - Stage 4)**: The platform now includes a complete lead capture workflow with:
- **Lead Journeys**: Tracks user actions throughout the rental process (search, view details, save favorites, request opportunities)
- **Rental Opportunity Requests (SOR)**: Allows users to formally request rental opportunities with:
  - Desired move-in date (optional)
  - Preferred contact method (email, phone, WhatsApp)
  - Additional notes
  - System enforces limit of 3 active SORs per user
  - One active SOR per property per user
  - Automatic logging in lead_journeys table

**Owner Property Management System (Current Implementation)**:
- **Property Approval Workflow**: Properties follow draft → pending → approved/rejected states
- **Owner-Submitted Change Requests**: Owners edit properties via change requests with:
  - Zod-validated whitelisted fields (title, description, price, location, etc.)
  - Transactional integrity for multi-step operations
  - Admin approval/rejection with review notes
  - Cascade logic that updates property.approvalStatus when change requests reach terminal states
- **Owner Settings**: Auto-approve visit appointments, notification preferences
- **Owner Property Management Pages**:
  - `/mis-propiedades`: List view with approval status badges
  - `/owner/property/:id`: Detailed view with tabs for details, change requests, staff, and appointments
- **Security**: All endpoints use Zod validation with whitelisted fields to prevent arbitrary field injection

### System Design Choices

The platform employs a unified middleware approach to normalize all authentication types (Replit Auth, local user auth, admin local auth) into a consistent `req.user` structure, simplifying authorization logic and ensuring seamless operation across different user types. Critical operations are automatically logged for auditing purposes. A public dashboard with an Airbnb-inspired design provides a user-friendly entry point, adapting its experience for authenticated vs. non-authenticated users. A calendar view for appointments enhances scheduling visualization, and detailed user profiles with activity history are available.

## External Dependencies

*   **Google Calendar API**: Used for automated Google Meet event creation and calendar event management.
*   **Neon Database**: Serverless PostgreSQL database solution.
*   **Replit Auth**: OpenID Connect provider for OAuth-based user authentication.
*   **Resend API**: Used for email verification during user registration.
*   **Radix UI**: Primitive component library for accessible UI elements.
*   **Lucide React**: Icon library.
*   **date-fns**: Library for date manipulation and formatting.
*   **react-day-picker**: Calendar component for date selection.
*   **Zod**: Runtime type validation and schema definition.