# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform designed for real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client, lawyer) and offers extensive features for property management, appointment scheduling, client presentations, service coordination, and offer processing with counter-negotiation. The platform aims to deliver a professional, data-rich user experience with robust role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a powerful back office. Its strategic ambition is to dominate the Tulum real estate market through advanced commission systems, marketing automation, predictive analytics, and AI-powered functionalities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built on a modern web stack, prioritizing a professional, responsive, accessible, and internationalized user experience.

### Frontend
The frontend utilizes React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are constructed with Radix UI and Shadcn/ui, styled using Tailwind CSS, and support light/dark themes. Forms are managed with Shadcn Form, `useForm`, and `zodResolver`, employing Zod for validation. A mobile-first design approach ensures optimization for various devices.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, offering a RESTful API. It incorporates role-based middleware, JSON error handling, and dual authentication mechanisms: Replit Auth (OpenID Connect) for general users and local username/password for administrators, alongside direct Google OAuth. Session management and user approval workflows are core functionalities. Centralized OpenAI service integration leverages the GPT-4 model, and contract routes feature strict Zod validation, data sanitization, and role-based authorization for verification.

### Data Storage
PostgreSQL, provided by Neon serverless, is used with Drizzle ORM for type-safe database interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, and a robust rental contract system. Performance is enhanced with B-tree indexes, and security includes authorization auditing and role validation.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard dynamically adapts content based on user authentication status. Real-time chat is implemented via WebSockets, ensuring session-based authentication and per-conversation authorization. A development-only authentication endpoint is available for testing role-switching functionalities.
Key features include:
*   **Role-Based Access Control**: Granular permissions across all user types with admin direct role assignment.
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment, dynamic slot availability, and manual property entry.
*   **Property Management Lifecycle**: Features property approval workflows, two-stage publication, owner change requests, sublease functionality, comprehensive photo editing, and a 7-step property submission wizard with digital agreement signing.
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking, owner payment approval, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to request and create rental offers, followed by a bidirectional counter-offer negotiation system.
*   **Contract Elaboration System**: Automated workflow after offer acceptance, involving forms, admin verification, lawyer elaboration, tripartite chat, and digital signatures.
*   **HOA Module**: Complete condominium management system for admin, owner, and HOA Manager roles.
*   **Comprehensive Notification System**: Full-featured system with real-time updates, filtering, priority levels, email integration, and user preferences.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **CRM Lead Management System**: Kanban-style lead management with a 10-stage rental pipeline, multi-step lead creation, sales funnel visualization, and quick actions.
*   **Operational Efficiency**: Marketing automation, preventive maintenance scheduling, enhanced referral tracking, and comprehensive admin CRUD systems.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and auto-logout security.

## External Dependencies
*   Google Calendar API
*   Gmail API
*   Google OAuth 2.0
*   Neon Database (PostgreSQL)
*   Replit Auth (OpenID Connect)
*   Radix UI
*   Lucide React
*   date-fns
*   react-day-picker
*   Zod
*   WebSocket (ws)
*   cookie
*   OpenAI GPT-5