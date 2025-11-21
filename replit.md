# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform designed for intelligent real estate property management in Tulum, Quintana Roo. Its primary goal is to optimize property management tasks, including scheduling, client interactions, service coordination, and offer processing. The platform offers key features such as role-based access, Google Calendar integration, a service provider marketplace, and digital agreement management. HomesApp aims to dominate the Tulum market through advanced commission systems, marketing automation, predictive analytics, and AI capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
HomesApp is built on a modern web stack, focusing on a professional, responsive, accessible, and internationalized user experience.

The frontend utilizes React 18 with TypeScript, Vite, Wouter, and TanStack Query. UI components are sourced from Radix UI and Shadcn/ui, styled with Tailwind CSS for responsive, mobile-first design supporting light/dark themes. Form management uses Shadcn Form, `useForm`, and Zod for validation.

The backend is developed with Node.js, Express.js, and TypeScript, providing a RESTful API. It incorporates role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, and integrated OpenAI services. Contract routes ensure Zod validation, data sanitization, and role-based authorization.

Data is persisted in PostgreSQL (Neon serverless) and accessed via Drizzle ORM for type-safe operations. The schema supports extensive management of users, properties, appointments, client presentations, service providers, offers, staff, audit logs, leads, condominiums, reviews, financials, payouts, and rental contracts.

Key architectural features include unified middleware for authentication and logging, content adaptation for public dashboards, and real-time chat via WebSockets. The platform offers advanced functionalities like role-based access control, a sophisticated appointment system, comprehensive property and rental lifecycle management with an offer system, automated contract generation, an HOA module, and a robust notification system. AI capabilities encompass predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant powered by OpenAI GPT-4. The system also includes a CRM lead management system, a referral system, Airbnb-style role switching, full i18n support, and an advanced External Property Management System with multi-tenant capabilities, detailed worker and owner management, an external calendar system, rental purpose classification, Google Calendar sync, comprehensive financial accounting, and an automated rent collection system with integrated payment reminders.

The platform implements extensive pagination and sortable columns across all tabular data, with consistent page reset and clamping logic to ensure a stable user experience during filtering and data updates. Mobile responsiveness is a core design principle, featuring SSR-safe auto-switching between card and table views based on device, with a manual override for desktop users. Unified filter UX is managed through Popover modals, and performance is optimized using TanStack Query caching strategies and React memoization techniques. Enterprise-grade security measures include data encryption at rest (AES-256-GCM), enhanced audit logging, rate limiting, and strict multi-tenant isolation.

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
*   express-rate-limit