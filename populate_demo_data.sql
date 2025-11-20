-- Script para poblar datos de demostración para presentación de agencia externa
-- Ejecutar con: psql $DATABASE_URL < populate_demo_data.sql

-- Variables de agencia existente
\set AGENCY_ID 'd7c84e0a-d9b8-4c82-ae9c-5f8e3c1b0a2d'
\set ADMIN_USER '8de3d5c5-b2ae-49a6-8545-8d6a3e9a0cab'

-- ============================================
-- 1. CREAR UNIDADES ADICIONALES EN CONDOMINIOS EXISTENTES
-- ============================================

-- Agregar más unidades a Aldea Zama
INSERT INTO external_units (id, agency_id, condominium_id, unit_number, typology, floor, bedrooms, bathrooms, area, is_active, created_by) VALUES
('unit-103-uuid', :AGENCY_ID, 'condo-1-uuid', '103', '2_recamaras', 'primer_piso', 2, 2.0, 85, true, :ADMIN_USER),
('unit-104-uuid', :AGENCY_ID, 'condo-1-uuid', '104', '1_recamara', 'segundo_piso', 1, 1.0, 65, true, :ADMIN_USER),
('unit-202-uuid', :AGENCY_ID, 'condo-1-uuid', '202', '3_recamaras', 'segundo_piso', 3, 2.5, 110, true, :ADMIN_USER),
('unit-203-uuid', :AGENCY_ID, 'condo-1-uuid', '203', 'estudio', 'tercer_piso', 0, 1.0, 45, true, :ADMIN_USER),
('unit-301-uuid', :AGENCY_ID, 'condo-1-uuid', '301', '2_recamaras', 'tercer_piso', 2, 2.0, 90, true, :ADMIN_USER)
ON CONFLICT (id) DO NOTHING;

-- Agregar unidades a La Veleta
INSERT INTO external_units (id, agency_id, condominium_id, unit_number, typology, floor, bedrooms, bathrooms, area, is_active, created_by) VALUES
('unit-lv-3-uuid', :AGENCY_ID, 'condo-2-uuid', '103', '1_recamara', 'primer_piso', 1, 1.0, 70, true, :ADMIN_USER),
('unit-lv-4-uuid', :AGENCY_ID, 'condo-2-uuid', '104', '2_recamaras', 'segundo_piso', 2, 2.0, 95, true, :ADMIN_USER),
('unit-lv-5-uuid', :AGENCY_ID, 'condo-2-uuid', '201', 'estudio_plus', 'segundo_piso', 1, 1.0, 55, true, :ADMIN_USER)
ON CONFLICT (id) DO NOTHING;

-- Agregar unidades a Bahía Príncipe
INSERT INTO external_units (id, agency_id, condominium_id, unit_number, typology, floor, bedrooms, bathrooms, area, is_active, created_by) VALUES
('unit-bp-3-uuid', :AGENCY_ID, 'condo-3-uuid', '103', '2_recamaras', 'primer_piso', 2, 2.0, 88, true, :ADMIN_USER),
('unit-bp-4-uuid', :AGENCY_ID, 'condo-3-uuid', '104', '1_recamara', 'segundo_piso', 1, 1.0, 68, true, :ADMIN_USER)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. PROPIETARIOS PARA LAS UNIDADES
-- ============================================

INSERT INTO external_unit_owners (id, unit_id, owner_name, owner_email, owner_phone, ownership_percentage, is_active) VALUES
-- Unidad 103 - Propietario único
(gen_random_uuid(), 'unit-103-uuid', 'Carlos Mendoza', 'carlos.mendoza@email.com', '+52 984 123 4567', 100.00, true),

-- Unidad 104 - Dos copropietarios
(gen_random_uuid(), 'unit-104-uuid', 'Ana Torres', 'ana.torres@email.com', '+52 984 234 5678', 50.00, true),
(gen_random_uuid(), 'unit-104-uuid', 'Luis Ramírez', 'luis.ramirez@email.com', '+52 984 345 6789', 50.00, true),

-- Unidad 202
(gen_random_uuid(), 'unit-202-uuid', 'Patricia Gómez', 'patricia.gomez@email.com', '+52 984 456 7890', 100.00, true),

-- Unidad 203 - Tres copropietarios
(gen_random_uuid(), 'unit-203-uuid', 'Roberto Silva', 'roberto.silva@email.com', '+52 984 567 8901', 33.33, true),
(gen_random_uuid(), 'unit-203-uuid', 'María Fernández', 'maria.fernandez@email.com', '+52 984 678 9012', 33.33, true),
(gen_random_uuid(), 'unit-203-uuid', 'Jorge Martínez', 'jorge.martinez@email.com', '+52 984 789 0123', 33.34, true),

-- Unidad 301
(gen_random_uuid(), 'unit-301-uuid', 'Elena Rodríguez', 'elena.rodriguez@email.com', '+52 984 890 1234', 100.00, true),

-- La Veleta units
(gen_random_uuid(), 'unit-lv-3-uuid', 'Miguel Ángel López', 'miguel.lopez@email.com', '+52 984 901 2345', 100.00, true),
(gen_random_uuid(), 'unit-lv-4-uuid', 'Sandra Morales', 'sandra.morales@email.com', '+52 984 012 3456', 100.00, true),
(gen_random_uuid(), 'unit-lv-5-uuid', 'Diego Vargas', 'diego.vargas@email.com', '+52 984 123 4567', 100.00, true),

-- Bahía Príncipe units
(gen_random_uuid(), 'unit-bp-3-uuid', 'Carmen Ruiz', 'carmen.ruiz@email.com', '+52 984 234 5678', 100.00, true),
(gen_random_uuid(), 'unit-bp-4-uuid', 'Fernando Castro', 'fernando.castro@email.com', '+52 984 345 6789', 100.00, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. CONTRATOS DE RENTA ACTIVOS
-- ============================================

INSERT INTO external_rental_contracts (id, agency_id, unit_id, tenant_name, tenant_email, tenant_phone, start_date, end_date, monthly_rent, currency, security_deposit, status, rental_purpose, created_by) VALUES
-- Contratos activos
('contract-103-uuid', :AGENCY_ID, 'unit-103-uuid', 'John Smith', 'john.smith@email.com', '+1 305 123 4567', '2025-01-01', '2025-12-31', 18000.00, 'MXN', 36000.00, 'active', 'long_term', :ADMIN_USER),
('contract-104-uuid', :AGENCY_ID, 'unit-104-uuid', 'Emma Johnson', 'emma.j@email.com', '+1 305 234 5678', '2024-11-01', '2025-10-31', 15000.00, 'MXN', 30000.00, 'active', 'long_term', :ADMIN_USER),
('contract-202-uuid', :AGENCY_ID, 'unit-202-uuid', 'Liam Williams', 'liam.w@email.com', '+1 305 345 6789', '2025-02-01', '2026-01-31', 22000.00, 'MXN', 44000.00, 'active', 'long_term', :ADMIN_USER),
('contract-203-uuid', :AGENCY_ID, 'unit-203-uuid', 'Sophia Brown', 'sophia.b@email.com', '+1 305 456 7890', '2024-12-01', '2025-05-31', 12000.00, 'MXN', 12000.00, 'active', 'short_term', :ADMIN_USER),
('contract-301-uuid', :AGENCY_ID, 'unit-301-uuid', 'Oliver Davis', 'oliver.d@email.com', '+1 305 567 8901', '2025-01-15', '2026-01-14', 19500.00, 'MXN', 39000.00, 'active', 'long_term', :ADMIN_USER),
('contract-lv3-uuid', :AGENCY_ID, 'unit-lv-3-uuid', 'Ava Miller', 'ava.m@email.com', '+1 305 678 9012', '2024-10-01', '2025-09-30', 16000.00, 'MXN', 32000.00, 'active', 'long_term', :ADMIN_USER),
('contract-lv4-uuid', :AGENCY_ID, 'unit-lv-4-uuid', 'Noah Wilson', 'noah.w@email.com', '+1 305 789 0123', '2025-01-01', '2025-12-31', 20000.00, 'MXN', 40000.00, 'active', 'long_term', :ADMIN_USER),
('contract-bp3-uuid', :AGENCY_ID, 'unit-bp-3-uuid', 'Isabella Moore', 'isabella.m@email.com', '+1 305 890 1234', '2024-11-15', '2025-11-14', 17500.00, 'MXN', 35000.00, 'active', 'long_term', :ADMIN_USER)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. PAYMENT SCHEDULES (Servicios recurrentes)
-- ============================================

-- Para cada contrato activo, crear schedules de servicios
-- Contrato 103
INSERT INTO external_payment_schedules (id, agency_id, unit_id, rental_contract_id, service_type, amount, currency, billing_day, is_active, notes, created_by) VALUES
(gen_random_uuid(), :AGENCY_ID, 'unit-103-uuid', 'contract-103-uuid', 'electricity', 800.00, 'MXN', 1, true, 'CFE bimestral', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-103-uuid', 'contract-103-uuid', 'water', 300.00, 'MXN', 1, true, 'CAPA mensual', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-103-uuid', 'contract-103-uuid', 'internet', 650.00, 'MXN', 5, true, 'Totalplay 200 Mbps', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-103-uuid', 'contract-103-uuid', 'gas', 400.00, 'MXN', 15, true, 'Gas LP mensual', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-103-uuid', 'contract-103-uuid', 'cleaning', 1200.00, 'MXN', 20, true, 'Limpieza quincenal', :ADMIN_USER)
ON CONFLICT DO NOTHING;

-- Contrato 104
INSERT INTO external_payment_schedules (id, agency_id, unit_id, rental_contract_id, service_type, amount, currency, billing_day, is_active, created_by) VALUES
(gen_random_uuid(), :AGENCY_ID, 'unit-104-uuid', 'contract-104-uuid', 'electricity', 650.00, 'MXN', 1, true, 'CFE bimestral', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-104-uuid', 'contract-104-uuid', 'water', 250.00, 'MXN', 1, true, 'CAPA mensual', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-104-uuid', 'contract-104-uuid', 'internet', 550.00, 'MXN', 5, true, 'Telmex 100 Mbps', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-104-uuid', 'contract-104-uuid', 'cleaning', 800.00, 'MXN', 15, true, 'Limpieza quincenal', :ADMIN_USER)
ON CONFLICT DO NOTHING;

-- Contrato 202
INSERT INTO external_payment_schedules (id, agency_id, unit_id, rental_contract_id, service_type, amount, currency, billing_day, is_active, created_by) VALUES
(gen_random_uuid(), :AGENCY_ID, 'unit-202-uuid', 'contract-202-uuid', 'electricity', 950.00, 'MXN', 1, true, 'CFE bimestral', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-202-uuid', 'contract-202-uuid', 'water', 350.00, 'MXN', 1, true, 'CAPA mensual', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-202-uuid', 'contract-202-uuid', 'internet', 750.00, 'MXN', 5, true, 'Totalplay 300 Mbps', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-202-uuid', 'contract-202-uuid', 'gas', 500.00, 'MXN', 15, true, 'Gas LP mensual', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'unit-202-uuid', 'contract-202-uuid', 'cleaning', 1500.00, 'MXN', 20, true, 'Limpieza semanal', :ADMIN_USER)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. TRANSACCIONES FINANCIERAS
-- ============================================

-- Cobros de renta a inquilinos (inflow)
INSERT INTO external_financial_transactions (id, agency_id, direction, category, status, gross_amount, fees, net_amount, currency, due_date, performed_date, payer_role, payee_role, unit_id, tenant_name, description, created_by) VALUES
-- Enero 2025 - Rentas cobradas
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'rent_income', 'completed', 18000.00, 0.00, 18000.00, 'MXN', '2025-01-05', '2025-01-03', 'tenant', 'agency', 'unit-103-uuid', 'John Smith', 'Renta mensual enero 2025', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'rent_income', 'completed', 15000.00, 0.00, 15000.00, 'MXN', '2025-01-05', '2025-01-04', 'tenant', 'agency', 'unit-104-uuid', 'Emma Johnson', 'Renta mensual enero 2025', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'rent_income', 'completed', 22000.00, 0.00, 22000.00, 'MXN', '2025-02-05', '2025-02-03', 'tenant', 'agency', 'unit-202-uuid', 'Liam Williams', 'Renta mensual febrero 2025', :ADMIN_USER),

-- Cobros de servicios a inquilinos
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'service_electricity', 'completed', 800.00, 0.00, 800.00, 'MXN', '2025-01-10', '2025-01-08', 'tenant', 'agency', 'unit-103-uuid', 'John Smith', 'Electricidad enero 2025', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'service_water', 'completed', 300.00, 0.00, 300.00, 'MXN', '2025-01-10', '2025-01-08', 'tenant', 'agency', 'unit-103-uuid', 'John Smith', 'Agua enero 2025', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'service_internet', 'completed', 650.00, 0.00, 650.00, 'MXN', '2025-01-10', '2025-01-09', 'tenant', 'agency', 'unit-103-uuid', 'John Smith', 'Internet enero 2025', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'service_cleaning', 'completed', 1200.00, 0.00, 1200.00, 'MXN', '2025-01-20', '2025-01-18', 'tenant', 'agency', 'unit-103-uuid', 'John Smith', 'Limpieza 1ra quincena enero', :ADMIN_USER),

-- Pagos a propietarios (outflow)
(gen_random_uuid(), :AGENCY_ID, 'outflow', 'rent_payout', 'completed', 18000.00, 1800.00, 16200.00, 'MXN', '2025-01-10', '2025-01-09', 'agency', 'owner', 'unit-103-uuid', NULL, 'Pago renta enero 2025 - Comisión 10%', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'outflow', 'rent_payout', 'completed', 15000.00, 1500.00, 13500.00, 'MXN', '2025-01-10', '2025-01-10', 'agency', 'owner', 'unit-104-uuid', NULL, 'Pago renta enero 2025 - Comisión 10%', :ADMIN_USER),

-- Cobros HOA fees a propietarios
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'hoa_fee', 'completed', 2500.00, 0.00, 2500.00, 'MXN', '2025-01-15', '2025-01-12', 'owner', 'agency', 'unit-103-uuid', NULL, 'Cuota mantenimiento condominio enero', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'hoa_fee', 'completed', 2500.00, 0.00, 2500.00, 'MXN', '2025-01-15', '2025-01-13', 'owner', 'agency', 'unit-104-uuid', NULL, 'Cuota mantenimiento condominio enero', :ADMIN_USER),

-- Cargos de mantenimiento
(gen_random_uuid(), :AGENCY_ID, 'outflow', 'maintenance_charge', 'completed', 3500.00, 0.00, 3500.00, 'MXN', '2025-01-18', '2025-01-16', 'agency', 'owner', 'unit-202-uuid', NULL, 'Reparación fuga lavabo', :ADMIN_USER),

-- Transacciones pendientes
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'rent_income', 'pending', 12000.00, 0.00, 12000.00, 'MXN', '2025-02-05', NULL, 'tenant', 'agency', 'unit-203-uuid', 'Sophia Brown', 'Renta mensual febrero 2025', :ADMIN_USER),
(gen_random_uuid(), :AGENCY_ID, 'inflow', 'rent_income', 'pending', 19500.00, 0.00, 19500.00, 'MXN', '2025-02-15', NULL, 'tenant', 'agency', 'unit-301-uuid', 'Oliver Davis', 'Renta mensual febrero 2025', :ADMIN_USER)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. CREAR USUARIOS TRABAJADORES
-- ============================================

INSERT INTO users (id, name, email, role, "assignedToAgency", created_at) VALUES
('worker-plumber-uuid', 'Juan Hernández', 'juan.plomero@mistiqtulum.com', 'external_agency_maintenance', :AGENCY_ID, NOW()),
('worker-electric-uuid', 'Pedro Sánchez', 'pedro.electricista@mistiqtulum.com', 'external_agency_maintenance', :AGENCY_ID, NOW()),
('worker-painter-uuid', 'Luis González', 'luis.pintor@mistiqtulum.com', 'external_agency_maintenance', :AGENCY_ID, NOW()),
('worker-ac-uuid', 'Roberto Díaz', 'roberto.clima@mistiqtulum.com', 'external_agency_maintenance', :AGENCY_ID, NOW()),
('worker-cleaner-uuid', 'María García', 'maria.limpieza@mistiqtulum.com', 'external_agency_maintenance', :AGENCY_ID, NOW())
ON CONFLICT (id) DO NOTHING;

-- Actualizar especialidades en users
UPDATE users SET "maintenanceSpecialty" = 'plumbing' WHERE id = 'worker-plumber-uuid';
UPDATE users SET "maintenanceSpecialty" = 'electrical' WHERE id = 'worker-electric-uuid';
UPDATE users SET "maintenanceSpecialty" = 'carpentry' WHERE id = 'worker-painter-uuid';
UPDATE users SET "maintenanceSpecialty" = 'hvac' WHERE id = 'worker-ac-uuid';
UPDATE users SET "maintenanceSpecialty" = 'general' WHERE id = 'worker-cleaner-uuid';

-- ============================================
-- 7. TICKETS DE MANTENIMIENTO
-- ============================================

INSERT INTO external_maintenance_tickets (id, agency_id, unit_id, condominium_id, title, description, category, priority, status, reported_by, assigned_to, estimated_cost, actual_cost, scheduled_date, scheduled_window_start, scheduled_window_end, created_by) VALUES
-- Ticket completado con fotos
('ticket-001-uuid', :AGENCY_ID, 'unit-103-uuid', 'condo-1-uuid', 'Fuga en lavabo del baño', 'Goteo constante en la llave del lavabo. Posible cambio de válvula.', 'plumbing', 'high', 'completed', 'John Smith', 'worker-plumber-uuid', 2500.00, 2200.00, '2025-01-10 09:00:00', '09:00:00', '12:00:00', :ADMIN_USER),

-- Ticket en progreso
('ticket-002-uuid', :AGENCY_ID, 'unit-104-uuid', 'condo-1-uuid', 'Revisión sistema eléctrico', 'Fallan algunos apagadores. Revisar instalación.', 'electrical', 'medium', 'in_progress', 'Emma Johnson', 'worker-electric-uuid', 1800.00, NULL, '2025-02-15 14:00:00', '14:00:00', '17:00:00', :ADMIN_USER),

-- Ticket pendiente
('ticket-003-uuid', :AGENCY_ID, 'unit-202-uuid', 'condo-1-uuid', 'Pintura paredes sala', 'Repintar paredes de sala principal. Color blanco mate.', 'general', 'low', 'assigned', 'Liam Williams', 'worker-painter-uuid', 4500.00, NULL, '2025-02-20 08:00:00', '08:00:00', '16:00:00', :ADMIN_USER),

-- Ticket completado - AC
('ticket-004-uuid', :AGENCY_ID, 'unit-301-uuid', 'condo-1-uuid', 'Mantenimiento aire acondicionado', 'Limpieza de filtros y carga de gas refrigerante.', 'hvac', 'medium', 'completed', 'Oliver Davis', 'worker-ac-uuid', 3000.00, 2800.00, '2025-01-25 10:00:00', '10:00:00', '13:00:00', :ADMIN_USER),

-- Ticket urgente abierto
('ticket-005-uuid', :AGENCY_ID, 'unit-203-uuid', 'condo-1-uuid', 'Fuga de agua en techo', 'Filtración de agua por techo del baño. URGENTE.', 'plumbing', 'urgent', 'open', 'Sophia Brown', NULL, NULL, NULL, NULL, NULL, NULL, :ADMIN_USER),

-- Ticket limpieza completado
('ticket-006-uuid', :AGENCY_ID, 'unit-lv-3-uuid', 'condo-2-uuid', 'Limpieza profunda post-inquilino', 'Limpieza completa después de mudanza.', 'general', 'medium', 'completed', NULL, 'worker-cleaner-uuid', 2500.00, 2500.00, '2025-01-15 08:00:00', '08:00:00', '16:00:00', :ADMIN_USER),

-- Más tickets variados
('ticket-007-uuid', :AGENCY_ID, 'unit-bp-3-uuid', 'condo-3-uuid', 'Cambio de cerradura', 'Instalar nueva cerradura en puerta principal.', 'general', 'medium', 'completed', 'Isabella Moore', 'worker-plumber-uuid', 1200.00, 1100.00, '2025-01-20 11:00:00', '11:00:00', '13:00:00', :ADMIN_USER),

('ticket-008-uuid', :AGENCY_ID, 'unit-lv-4-uuid', 'condo-2-uuid', 'Reparación ventana cocina', 'Ventana no cierra correctamente. Ajustar bisagras.', 'carpentry', 'low', 'in_progress', 'Noah Wilson', 'worker-painter-uuid', 800.00, NULL, '2025-02-18 09:00:00', '09:00:00', '12:00:00', :ADMIN_USER)
ON CONFLICT (id) DO NOTHING;

-- Cerrar tickets completados
UPDATE external_maintenance_tickets 
SET closed_by = :ADMIN_USER, closed_at = scheduled_date + INTERVAL '3 hours'
WHERE status = 'completed';

-- ============================================
-- 8. ACTUALIZACIONES DE TICKETS
-- ============================================

INSERT INTO external_maintenance_updates (id, ticket_id, update_type, status, notes, created_by) VALUES
-- Ticket 001 - Fuga lavabo (completado)
(gen_random_uuid(), 'ticket-001-uuid', 'comment', 'completed', 'Trabajo iniciado. Revisando válvulas.', 'worker-plumber-uuid'),
(gen_random_uuid(), 'ticket-001-uuid', 'status_change', 'completed', 'Válvula reemplazada. Fuga solucionada.', 'worker-plumber-uuid'),
(gen_random_uuid(), 'ticket-001-uuid', 'comment', 'completed', 'Trabajo completado exitosamente. Cliente satisfecho.', 'worker-plumber-uuid'),

-- Ticket 002 - Sistema eléctrico (en progreso)
(gen_random_uuid(), 'ticket-002-uuid', 'comment', 'in_progress', 'Revisando panel eléctrico. Detectados 2 breakers defectuosos.', 'worker-electric-uuid'),
(gen_random_uuid(), 'ticket-002-uuid', 'status_change', 'in_progress', 'Breakers reemplazados. Falta revisar cableado en sala.', 'worker-electric-uuid'),

-- Ticket 004 - AC (completado)
(gen_random_uuid(), 'ticket-004-uuid', 'comment', 'completed', 'Limpieza de filtros completada.', 'worker-ac-uuid'),
(gen_random_uuid(), 'ticket-004-uuid', 'comment', 'completed', 'Recarga de gas refrigerante R410A realizada.', 'worker-ac-uuid'),
(gen_random_uuid(), 'ticket-004-uuid', 'status_change', 'completed', 'Mantenimiento completado. Equipo funcionando óptimamente.', 'worker-ac-uuid'),

-- Ticket 006 - Limpieza (completado)
(gen_random_uuid(), 'ticket-006-uuid', 'status_change', 'completed', 'Limpieza profunda completada en todas las áreas.', 'worker-cleaner-uuid'),

-- Ticket 007 - Cerradura (completado)
(gen_random_uuid(), 'ticket-007-uuid', 'comment', 'completed', 'Cerradura instalada y probada. Entregadas 3 copias de llaves.', 'worker-plumber-uuid'),

-- Ticket 008 - Ventana (en progreso)
(gen_random_uuid(), 'ticket-008-uuid', 'comment', 'in_progress', 'Bisagras ajustadas. Probando cierre.', 'worker-painter-uuid')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. FOTOS DE MANTENIMIENTO (Before/During/After)
-- ============================================

-- Usando URLs de placeholder de Unsplash para demo
INSERT INTO external_maintenance_photos (id, ticket_id, phase, storage_key, caption, uploaded_by) VALUES
-- Ticket 001 - Fuga lavabo
(gen_random_uuid(), 'ticket-001-uuid', 'before', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800', 'Lavabo con fuga visible en válvula', 'worker-plumber-uuid'),
(gen_random_uuid(), 'ticket-001-uuid', 'during', 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800', 'Desmontaje de válvula antigua', 'worker-plumber-uuid'),
(gen_random_uuid(), 'ticket-001-uuid', 'after', 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800', 'Nueva válvula instalada, sin fugas', 'worker-plumber-uuid'),

-- Ticket 004 - AC
(gen_random_uuid(), 'ticket-004-uuid', 'before', 'https://images.unsplash.com/photo-1631545806609-3b0e4de1f65b?w=800', 'Filtros sucios antes de limpieza', 'worker-ac-uuid'),
(gen_random_uuid(), 'ticket-004-uuid', 'during', 'https://images.unsplash.com/photo-1635274530424-21f24c14fb02?w=800', 'Proceso de limpieza de filtros', 'worker-ac-uuid'),
(gen_random_uuid(), 'ticket-004-uuid', 'after', 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800', 'Filtros limpios instalados', 'worker-ac-uuid'),
(gen_random_uuid(), 'ticket-004-uuid', 'after', 'https://images.unsplash.com/photo-1614678096640-b9df2161f2c4?w=800', 'Equipo funcionando correctamente', 'worker-ac-uuid'),

-- Ticket 006 - Limpieza
(gen_random_uuid(), 'ticket-006-uuid', 'before', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', 'Unidad antes de limpieza', 'worker-cleaner-uuid'),
(gen_random_uuid(), 'ticket-006-uuid', 'after', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 'Sala limpia y organizada', 'worker-cleaner-uuid'),
(gen_random_uuid(), 'ticket-006-uuid', 'after', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', 'Cocina limpia', 'worker-cleaner-uuid'),
(gen_random_uuid(), 'ticket-006-uuid', 'after', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', 'Baño impecable', 'worker-cleaner-uuid'),

-- Ticket 007 - Cerradura
(gen_random_uuid(), 'ticket-007-uuid', 'before', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'Cerradura antigua', 'worker-plumber-uuid'),
(gen_random_uuid(), 'ticket-007-uuid', 'after', 'https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=800', 'Nueva cerradura instalada', 'worker-plumber-uuid'),

-- Ticket 002 - Eléctrico (en progreso)
(gen_random_uuid(), 'ticket-002-uuid', 'before', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', 'Panel eléctrico con breakers defectuosos', 'worker-electric-uuid'),
(gen_random_uuid(), 'ticket-002-uuid', 'during', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800', 'Reemplazo de breakers', 'worker-electric-uuid')
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. CONTROLES DE ACCESO
-- ============================================

INSERT INTO external_unit_access_controls (id, unit_id, access_type, access_code, description, is_active, can_share_with_maintenance, created_by) VALUES
(gen_random_uuid(), 'unit-103-uuid', 'door_code', '4782', 'Código puerta principal', true, true, :ADMIN_USER),
(gen_random_uuid(), 'unit-103-uuid', 'wifi', 'Aldea2025!', 'WiFi: ALDEA_103', true, false, :ADMIN_USER),
(gen_random_uuid(), 'unit-103-uuid', 'gate', '9876', 'Portón principal condominio', true, true, :ADMIN_USER),

(gen_random_uuid(), 'unit-104-uuid', 'door_code', '1234', 'Código puerta principal', true, true, :ADMIN_USER),
(gen_random_uuid(), 'unit-104-uuid', 'wifi', 'Welcome104', 'WiFi: TULUM_104', true, false, :ADMIN_USER),

(gen_random_uuid(), 'unit-202-uuid', 'door_code', '5678', 'Código puerta principal', true, true, :ADMIN_USER),
(gen_random_uuid(), 'unit-202-uuid', 'wifi', 'Secure2025', 'WiFi: VELETA_202', true, false, :ADMIN_USER),
(gen_random_uuid(), 'unit-202-uuid', 'parking', 'P-45', 'Cajón de estacionamiento asignado', true, true, :ADMIN_USER),

(gen_random_uuid(), 'unit-301-uuid', 'door_code', '9012', 'Código puerta principal', true, true, :ADMIN_USER),
(gen_random_uuid(), 'unit-301-uuid', 'wifi', 'Tulum301Pass', 'WiFi: BAHIA_301', true, false, :ADMIN_USER),
(gen_random_uuid(), 'unit-301-uuid', 'elevator', '3456', 'Código elevador privado', true, true, :ADMIN_USER)
ON CONFLICT DO NOTHING;

COMMIT;
