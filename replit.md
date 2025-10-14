# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform for real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client, lawyer) and offers features such as property management, appointment scheduling, client presentations, service coordination, and offer processing with counter-negotiation. The platform aims to provide a professional, data-rich user experience with role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a robust back office. Its ambition is to dominate the Tulum real estate market through enhanced commission systems, marketing automation, predictive analytics, and AI-powered features.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Updates (October 14, 2025)

### Performance Optimizations
*   **PublicDashboard Loading Speed**: Implemented comprehensive optimizations to reduce initial page load time
    - Added `limit` parameter to `/api/properties/search` endpoint (backend support in routes.ts and storage.ts)
    - PublicDashboard now loads only 12 properties instead of entire dataset using `limit=12` query parameter
    - Implemented lazy loading for colonies and condominiums - only fetched when user opens filter panel (`enabled: showFilters`)
    - Reduced duplicate API calls through better React Query configuration
*   **Database Performance**: Created B-tree indexes for frequently queried property fields:
    - Single-field indexes: `featured`, `rating`, `colony_name`, `condo_name`, `property_type`
    - Composite index: `(published, featured, rating)` for optimized public property searches
    - Indexes verified in production database using pg_indexes query
*   **Performance Results**: Initial property search reduced from ~800ms to ~470ms, with subsequent cached requests at ~117ms

### Lead Status Automation & Offer Management Fixes
*   **Automatic Lead Status Progression**: Implemented automatic lead status updates in offer workflow
    - Added `leadId` field to `offer_tokens` table to track lead associations
    - When seller generates offer link for a lead → status automatically updates to `"oferta_enviada"`
    - When client submits completed offer → status automatically updates to `"en_negociacion"`
    - Backend validates lead existence before status updates
    - Cache invalidation ensures UI updates reflect status changes immediately
*   **Admin Offer Management Display**: Fixed critical issues with offer data display in admin panel
    - Corrected field mapping to match PublicOfferForm schema (fullName, email, phone, nationality, occupation, usageType, monthlyRent, currency, contractDuration, moveInDate, numberOfOccupants, pets, petDetails, etc.)
    - Fixed tab filtering logic for Pendientes/Completadas/Expiradas categories
    - Added complete offer information display including:
      - Tipo de uso (vivienda/subarrendamiento)
      - Costo de contrato and depósito de seguridad
      - Servicios ofrecidos and servicios requeridos
      - Firma digital visualization
      - Submission timestamp
      - Pet photos gallery when applicable
    - All fields now display with proper fallback values ("No especificado") for missing data

### Public Offer Form & PDF Enhancements
*   **PublicOfferForm Visual Improvements**: Enhanced user experience for clients receiving offer links
    - Added HomesApp logo in header for professional branding
    - Implemented horizontal scrollable photo gallery displaying up to 5 property photos
    - Created prominent display card with gradient background showing:
      - Property address
      - Monthly rent amount (large, bold, primary color)
      - Required services from property owner (displayed as badges)
    - Improved visual hierarchy and information accessibility for clients
*   **PDF Generation Enhancements**: Professional document styling for offer PDFs
    - Enhanced header with blue gradient background and HomesApp branding
    - Added visual sections with background colors (gray for property info, green for offer details)
    - Improved typography with bold text highlighting key information (monthly rent, client name, etc.)
    - Structured sections with clear uppercase labels: PROPIEDAD, INFORMACIÓN DEL SOLICITANTE, DETALLES DE LA OFERTA, SERVICIOS, MASCOTAS, COMENTARIOS ADICIONALES
    - Professional footer with disclaimers and branding
    - Comprehensive data display including all offer fields, services breakdown, and pet information

### Tenant Rental Application Form System (NEW)
*   **Complete Workflow Implementation**: Full-featured tenant rental application system integrated with leads workflow
    - Activates when leads reach "en_negociacion" status
    - "Enviar Formato de Renta" button appears in LeadsKanban for eligible leads
    - Generates temporary 24-hour secure links for tenant form submission
    - Multi-channel sharing via email and WhatsApp with customizable messages
*   **GenerateRentalFormLinkDialog Component**: Token-based link generation with sharing capabilities
    - Creates unique tokens with 24-hour expiration
    - Associates tokens with specific property and lead for tracking
    - Email/WhatsApp sharing with pre-filled messages
    - Copy-to-clipboard functionality for manual sharing
*   **PublicRentalForm (Multi-Step Form)**: Comprehensive tenant application form accessible via temporary links
    - **Step 1 - General Data**: Full name, contact info (email, WhatsApp, alternate phone), address, nationality, age, marital status, time in Tulum
    - **Step 2 - Employment Info**: Job position, company name, workplace address, monthly income, company tenure
    - **Step 3 - Rental Details**: Check-in date, number of tenants, payment method preference, pet information
    - **Step 4 - Terms & Submission**: Terms acceptance checkbox, digital signature capture, final review
    - Token validation on load (expired/used checks)
    - Property information display for context
    - Form state persistence across steps
    - Comprehensive validation with Zod schemas
*   **Backend API Endpoints**:
    - POST `/api/rental-form-tokens` - Create new token for property/lead
    - GET `/api/rental-form-tokens/:token/validate` - Validate token (public route)
    - POST `/api/rental-form-tokens/:token/submit` - Submit completed form (public route)
    - POST `/api/rental-form-tokens/:id/send-email` - Resend link via email
    - GET `/api/rental-form-tokens` - List all tokens (admin only)
    - GET `/api/rental-forms` - Get all submissions with filtering (admin only)
    - PATCH `/api/rental-forms/:id/review` - Approve/reject submission (admin only)
*   **AdminRentalFormManagement Page**: Complete admin interface for reviewing tenant applications
    - Dashboard with statistics (Pendientes, En Revisión, Aprobados, Rechazados)
    - Tabbed interface for filtering by status
    - Detailed submission cards showing: tenant info, employment details, rental preferences, submission timestamp
    - Full details modal displaying all form data
    - Approve/Reject workflow with admin notes capability
    - Property and lead association tracking
*   **Database Schema** (4 new tables created via SQL):
    - `tenant_rental_form_tokens`: Manages temporary links (token, propertyId, leadId, expiresAt, isUsed, createdBy)
    - `tenant_rental_forms`: Stores submitted applications (all tenant data fields, status, reviewedBy, reviewedAt, adminNotes)
    - `owner_document_tokens`: Reserved for future owner document collection workflow
    - `owner_document_submissions`: Reserved for future owner document workflow
*   **Security & Validation**:
    - Token expiration enforced (24 hours)
    - Single-use token validation (cannot resubmit after use)
    - Admin-only routes protected with role-based middleware (admin, master, admin_jr)
    - Public routes properly isolated (validate, submit)
    - Lead association tracking for workflow continuity
*   **Workflow Integration**:
    - Lead status remains "en_negociacion" throughout tenant application process
    - After admin approval, workflow continues to contract elaboration phase
    - Audit logging for all admin actions (approval, rejection)
    - Cache invalidation ensures real-time UI updates
*   **Routes**:
    - Public form: `/rental-form/:token` (no authentication required)
    - Admin management: `/admin/rental-forms` (admin roles only)

## System Architecture
The platform is built with a modern web stack, emphasizing a professional, responsive, and accessible user experience with full internationalization.

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with Radix UI and Shadcn/ui, styled using Tailwind CSS, and support light/dark themes. Forms use Shadcn Form, `useForm`, and `zodResolver` with Zod for validation. The platform is optimized for mobile devices with a mobile-first design approach.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, providing a RESTful API. It includes role-based middleware, JSON error handling, and dual authentication: Replit Auth (OpenID Connect) for general users and local username/password for administrators, alongside direct Google OAuth. Session management and user approval workflows are integral. Centralized OpenAI service integration utilizes the GPT-4 model. Contract routes implement strict Zod validation, data sanitization, and role-based authorization for verification workflows.

### Data Storage
PostgreSQL (Neon serverless) with Drizzle ORM provides type-safe database interactions. The schema supports user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, and a comprehensive rental contract system. Performance is optimized with B-tree indexes, and security includes authorization auditing and role validation.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard adapts based on user authentication status. WebSocket-based real-time chat ensures session-based authentication and per-conversation authorization. A development-only authentication endpoint facilitates role switching for testing purposes.

### Key Features
*   **Role-Based Access Control**: Granular permissions across all user types with admin direct role assignment capability.
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment, dynamic slot availability, and manual property entry for properties not yet in the database.
*   **Property Management Lifecycle**: Features property approval workflows with a two-stage publication system, owner change requests, sublease functionality, comprehensive photo editing, and a 7-step property submission wizard with private owner data collection and digital agreement signing.
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking, owner payment approval, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to request and create rental offers, followed by a bidirectional counter-offer negotiation system.
*   **Contract Elaboration System**: Automated workflow after offer acceptance, involving forms, admin verification, lawyer elaboration, tripartite chat, and digital signatures.
*   **HOA (Homeowners Association) Module**: Complete condominium management system for admin, owner, and HOA Manager roles.
*   **Comprehensive Notification System**: Full-featured notification system with real-time updates, filtering, priority levels, email integration, and user preferences.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **CRM Lead Management System**: Kanban-style lead management with a 10-stage rental pipeline, multi-step lead creation form, sales funnel visualization, and quick actions on lead cards.
*   **Operational Efficiency**: Marketing automation, preventive maintenance scheduling, enhanced referral tracking, and comprehensive admin CRUD systems.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and auto-logout security feature.

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