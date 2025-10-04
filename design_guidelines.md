# Design Guidelines: Real Estate Property Management Platform

## Design Approach

**Selected Approach**: Design System - Modern SaaS Dashboard Pattern
**Rationale**: This is a utility-focused, information-dense productivity application requiring efficient workflows across multiple user roles. Drawing inspiration from professional property management platforms (Buildium, AppFolio) and modern CRM systems (HubSpot, Linear).

**Core Principles**:
- Professional & trustworthy aesthetic
- Information hierarchy for data-heavy interfaces
- Role-based UI adaptations
- Efficient workflow optimization

---

## Color Palette

### Light Mode
- **Primary Brand**: 214 84% 56% (Professional blue - trust, reliability)
- **Primary Hover**: 214 84% 48%
- **Secondary**: 262 52% 47% (Deep purple - sophistication)
- **Background**: 0 0% 100%
- **Surface**: 220 14% 96%
- **Border**: 220 13% 91%
- **Text Primary**: 222 47% 11%
- **Text Secondary**: 215 16% 47%
- **Success**: 142 71% 45% (Property approved, deals closed)
- **Warning**: 38 92% 50% (Pending approvals, scheduled appointments)
- **Error**: 0 84% 60% (Rejections, conflicts)

### Dark Mode
- **Primary Brand**: 214 84% 56%
- **Primary Hover**: 214 84% 64%
- **Secondary**: 262 52% 60%
- **Background**: 222 47% 11%
- **Surface**: 217 33% 17%
- **Border**: 217 33% 24%
- **Text Primary**: 210 40% 98%
- **Text Secondary**: 215 20% 65%

---

## Typography

**Font Families**:
- Primary: 'Inter' (Google Fonts) - Clean, modern, excellent for data-heavy interfaces
- Monospace: 'JetBrains Mono' - Property IDs, transaction numbers

**Type Scale**:
- **Headings**: 
  - H1: text-4xl font-bold (Dashboard titles)
  - H2: text-2xl font-semibold (Section headers)
  - H3: text-xl font-semibold (Card headers)
  - H4: text-lg font-medium (Subsections)
- **Body**: text-base font-normal
- **Small**: text-sm (Meta information, labels)
- **Tiny**: text-xs (Timestamps, helper text)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Tight spacing: p-2, gap-2 (Dense data tables)
- Standard: p-4, gap-4 (Cards, form fields)
- Comfortable: p-6, gap-6 (Main content areas)
- Generous: p-8, gap-8 (Page sections)
- Extra: p-12, p-16 (Marketing elements only)

**Grid System**:
- Dashboard: Sidebar (64px collapsed, 256px expanded) + Main content (flex-1)
- Content: max-w-7xl mx-auto px-4
- Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Property listings: grid-cols-1 lg:grid-cols-2 xl:grid-cols-3

---

## Component Library

### Navigation
**Sidebar Navigation** (Role-based):
- Collapsible with icons + labels
- Active state: bg-primary/10 border-l-4 border-primary
- Grouped sections (Propiedades, Citas, Administración, Directorio)
- User profile card at bottom with role badge

**Top Bar**:
- Search (global property/client search)
- Quick actions (Nueva Cita, Nueva Propiedad)
- Notifications bell with count badge
- User menu dropdown

### Property Cards
**Property Listing Card**:
- Image gallery (3-5 images, primary + thumbnails)
- Property status badge (En Renta, En Venta, Ambos)
- Key metrics: Precio, Recámaras, Baños, m²
- Quick actions: Ver, Editar, Agendar Cita
- Owner/Management info
- Border: border rounded-lg shadow-sm hover:shadow-md transition

### Appointment Management
**Calendar View**:
- Monthly/Weekly/Daily toggle
- Color-coded by type: In-person (blue), Video call (purple), Pending (yellow)
- Time slots with property preview on hover
- Drag-to-reschedule functionality

**Appointment Card**:
- Client info + property preview
- Date/time with timezone
- Meeting type (Presencial / Videollamada)
- Participants (Cliente, Conserje, Admin if required)
- Google Meet link (for video calls)
- Status workflow: Solicitada → Confirmada → Completada / Cancelada

### Client Presentation Cards (Tarjetas)
**Filter Card Design**:
- Compact form layout
- Property preferences: Tipo, Modalidad, Rango de precio, Ubicación
- Requirements: Recámaras, Baños, Amenidades
- Save/Share functionality
- Match indicator (X propiedades coinciden)

### Forms
**Input Fields**:
- Outlined style with label animation on focus
- Helper text below (text-sm text-secondary)
- Error states: border-error text-error
- Required indicator: asterisk in label

**Buttons**:
- Primary: bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2
- Secondary: border border-primary text-primary hover:bg-primary/5
- Danger: bg-error hover:bg-error-dark (for delete actions)
- Icon buttons: p-2 rounded-md hover:bg-surface

### Data Display
**Tables** (Backoffice):
- Striped rows: odd:bg-surface
- Sticky header with filters
- Row actions menu (three dots)
- Sortable columns
- Pagination: 10/25/50/100 per page
- Bulk selection with checkboxes

**Status Badges**:
- Pill shape: rounded-full px-3 py-1 text-xs font-medium
- Color-coded: Aprobado (green), Pendiente (yellow), Rechazado (red)

### Service Provider Directory
**Provider Card**:
- Profile photo (circular, 80px)
- Name + specialty badge
- Rating stars (5-star system)
- Services list with pricing
- Contact buttons: Mensaje, Llamar, Contratar
- Availability indicator (green dot if online)

**Service Listing**:
- Service name + description
- Pricing (Desde $X MXN)
- Estimated duration
- Add to cart/Request quote buttons

### Modals & Overlays
**Modal Structure**:
- Max width: max-w-2xl (forms), max-w-4xl (property details)
- Backdrop: bg-black/50 backdrop-blur-sm
- Close button: top-right with X icon
- Footer with action buttons

**Approval Queue Modal** (Admin feature):
- List of pending users with details
- Individual approve/reject OR
- **"Aprobar Todos"** button at top (destructive-style warning)
- Filters by role type

---

## Role-Based UI Variations

**Master Admin**:
- Full system access
- User management dashboard
- Analytics/Reports section
- Bulk approval controls

**Property Owner**:
- "Mis Propiedades" dashboard
- Property editor with pricing/modality toggles
- Staff assignment interface (per property)
- Service provider directory access

**Seller**:
- All listings view (read-only owner info)
- Client management
- Appointment scheduling
- Commission tracking

**Service Provider**:
- Profile/portfolio editor
- Service catalog manager
- Booking requests inbox
- Earnings dashboard

---

## Animations

Use **sparingly** and purposefully:
- Page transitions: Fade-in (150ms)
- Dropdown menus: Slide-down (200ms)
- Toast notifications: Slide-in from top-right (300ms)
- Loading states: Skeleton screens (no spinners for data tables)

---

## Images

### Property Images
- **Hero**: Large property image (16:9 ratio, 1200x675px minimum)
- **Gallery**: Grid of 4-6 images with lightbox view
- **Thumbnails**: Small previews in cards (300x200px)
- Use placeholder service (Unsplash API) for real estate imagery

### Profile Photos
- **User avatars**: Circular, 40px (navigation), 80px (profiles)
- **Provider photos**: 80px circular with border

### No Large Hero Section
This is a utility application - skip marketing-style heroes. Begin with functional dashboard layouts immediately after navigation.

---

## Accessibility

- WCAG 2.1 AA compliance
- Minimum contrast ratio 4.5:1 for text
- Keyboard navigation for all interactive elements
- Focus indicators: ring-2 ring-primary ring-offset-2
- Screen reader labels for icon-only buttons
- Form validation with clear error messages
- Dark mode support with consistent input styling