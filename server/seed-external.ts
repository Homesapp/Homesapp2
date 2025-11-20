import { db } from "./db";
import { sql } from "drizzle-orm";

async function seedExternalSystem() {
  console.log("🌱 Iniciando seed del sistema externo...");

  try {
    await db.execute(sql`
      -- Crear usuarios para el sistema externo
      INSERT INTO users (id, email, first_name, last_name, role, status, phone, password_hash, require_password_change)
      VALUES 
        ('external-admin-1', 'external.admin@test.com', 'Admin', 'External', 'external_agency_admin', 'approved', '+52 998 100 0001', '$2a$10$YourHashHere', false),
        ('external-accounting-1', 'external.accounting@test.com', 'Contador', 'External', 'external_agency_accounting', 'approved', '+52 998 100 0002', '$2a$10$YourHashHere', false),
        ('external-maintenance-1', 'external.maintenance@test.com', 'Mantenimiento', 'Worker', 'external_agency_maintenance', 'approved', '+52 998 100 0003', '$2a$10$YourHashHere', false),
        ('external-staff-1', 'external.staff@test.com', 'Staff', 'External', 'external_agency_staff', 'approved', '+52 998 100 0004', '$2a$10$YourHashHere', false)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Usuarios externos creados');

    await db.execute(sql`
      -- Crear agencia externa (MISTIQ Tulum)
      INSERT INTO external_agencies (id, name, description, contact_name, contact_email, contact_phone, created_by)
      VALUES 
        ('d7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Mistiq Tulum', 'Gestión de propiedades en Tulum, Q.Roo', 'Admin MISTIQ', 'admin@mistiqtulum.com', '+52 984 123 4567', 'external-admin-1')
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        contact_email = EXCLUDED.contact_email;
    `);
    console.log('✅ Agencia externa creada');

    await db.execute(sql`
      -- Asignar usuarios a la agencia
      UPDATE users 
      SET assigned_to_user = 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51'
      WHERE id IN ('external-admin-1', 'external-accounting-1', 'external-maintenance-1', 'external-staff-1');
    `);

    await db.execute(sql`
      -- Crear condominios externos
      INSERT INTO external_condominiums (id, agency_id, name, address, total_units, created_by)
      VALUES 
        ('condo-1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Aldea Zamá Residencial', 'Aldea Zamá, Tulum', 24, 'external-admin-1'),
        ('condo-2-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'La Veleta Gardens', 'La Veleta, Tulum', 18, 'external-admin-1'),
        ('condo-3-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Holistika Condos', 'Holistika, Tulum', 12, 'external-admin-1')
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        total_units = EXCLUDED.total_units;
    `);
    console.log('✅ Condominios externos creados');

    await db.execute(sql`
      -- Crear unidades externas
      INSERT INTO external_units (id, condominium_id, agency_id, unit_number, bedrooms, bathrooms, area, created_by)
      VALUES 
        ('unit-101-uuid', 'condo-1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', '101', 2, 2.0, 85.5, 'external-admin-1'),
        ('unit-102-uuid', 'condo-1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', '102', 2, 2.0, 85.5, 'external-admin-1'),
        ('unit-201-uuid', 'condo-1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', '201', 3, 2.0, 110.0, 'external-admin-1'),
        ('unit-202-uuid', 'condo-1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', '202', 3, 2.0, 110.0, 'external-admin-1'),
        ('unit-a1-uuid', 'condo-2-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'A1', 1, 1.0, 55.0, 'external-admin-1'),
        ('unit-a2-uuid', 'condo-2-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'A2', 1, 1.0, 55.0, 'external-admin-1'),
        ('unit-b1-uuid', 'condo-2-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'B1', 2, 1.0, 75.0, 'external-admin-1'),
        ('unit-h1-uuid', 'condo-3-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'H1', 2, 2.0, 90.0, 'external-admin-1'),
        ('unit-h2-uuid', 'condo-3-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'H2', 2, 2.0, 90.0, 'external-admin-1'),
        ('unit-h3-uuid', 'condo-3-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'H3', 3, 2.0, 120.0, 'external-admin-1')
      ON CONFLICT (id) DO UPDATE SET 
        unit_number = EXCLUDED.unit_number,
        bedrooms = EXCLUDED.bedrooms;
    `);
    console.log('✅ Unidades externas creadas');

    await db.execute(sql`
      -- Crear propietarios de unidades
      INSERT INTO external_unit_owners (id, unit_id, owner_name, owner_email, owner_phone, created_by)
      VALUES 
        ('owner-ext-1', 'unit-101-uuid', 'Carlos Martínez', 'carlos.martinez@email.com', '+52 998 111 1111', 'external-admin-1'),
        ('owner-ext-2', 'unit-201-uuid', 'Ana López', 'ana.lopez@email.com', '+52 998 222 2222', 'external-admin-1'),
        ('owner-ext-3', 'unit-a1-uuid', 'Roberto Sánchez', 'roberto.sanchez@email.com', '+52 998 333 3333', 'external-admin-1'),
        ('owner-ext-4', 'unit-h1-uuid', 'Laura Hernández', 'laura.hernandez@email.com', '+52 998 444 4444', 'external-admin-1'),
        ('owner-ext-5', 'unit-102-uuid', 'Pedro Ramírez', 'pedro.ramirez@email.com', '+52 998 555 5555', 'external-admin-1'),
        ('owner-ext-6', 'unit-202-uuid', 'María González', 'maria.gonzalez@email.com', '+52 998 666 6666', 'external-admin-1'),
        ('owner-ext-7', 'unit-b1-uuid', 'Juan Torres', 'juan.torres@email.com', '+52 998 777 7777', 'external-admin-1')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Propietarios de unidades creados');

    await db.execute(sql`
      -- Crear contratos de renta (fechas actualizadas cerca de noviembre 2025)
      INSERT INTO external_rental_contracts (id, unit_id, agency_id, tenant_name, tenant_email, tenant_phone, monthly_rent, currency, lease_duration_months, start_date, end_date, status, created_by)
      VALUES 
        ('contract-1-uuid', 'unit-101-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Laura Martínez', 'laura.m@email.com', '+52 998 555 1111', 18000.00, 'MXN', 12, '2025-07-01', '2026-07-01', 'active', 'external-admin-1'),
        ('contract-2-uuid', 'unit-201-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Michael Smith', 'michael.smith@email.com', '+1 555 222 3333', 1200.00, 'USD', 12, '2025-08-01', '2026-08-01', 'active', 'external-admin-1'),
        ('contract-3-uuid', 'unit-a1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Carmen Rodríguez', 'carmen.r@email.com', '+52 998 666 2222', 15000.00, 'MXN', 12, '2025-06-15', '2026-06-15', 'active', 'external-admin-1'),
        ('contract-4-uuid', 'unit-h1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Sophie Dubois', 'sophie.d@email.com', '+33 6 12 34 56 78', 1500.00, 'USD', 24, '2025-05-01', '2027-05-01', 'active', 'external-admin-1'),
        ('contract-5-uuid', 'unit-h2-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'José García López', 'jose.garcia@email.com', '+52 998 777 3333', 25000.00, 'MXN', 12, '2025-09-01', '2026-09-01', 'active', 'external-admin-1'),
        ('contract-6-uuid', 'unit-102-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Emma Johnson', 'emma.j@email.com', '+1 555 888 9999', 950.00, 'USD', 6, '2025-10-01', '2026-04-01', 'active', 'external-admin-1'),
        ('contract-7-uuid', 'unit-202-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Diego Fernández', 'diego.f@email.com', '+52 998 999 1111', 28000.00, 'MXN', 12, '2025-11-01', '2026-11-01', 'active', 'external-admin-1'),
        ('contract-8-uuid', 'unit-b1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Isabella Rossi', 'isabella.r@email.com', '+39 333 123 4567', 1100.00, 'USD', 12, '2025-08-15', '2026-08-15', 'active', 'external-admin-1')
      ON CONFLICT (id) DO UPDATE SET 
        tenant_name = EXCLUDED.tenant_name,
        status = EXCLUDED.status;
    `);
    console.log('✅ Contratos de renta creados');

    await db.execute(sql`
      -- Crear payment schedules para rentas
      INSERT INTO external_payment_schedules (id, agency_id, contract_id, service_type, amount, currency, day_of_month, is_active, send_reminder_days_before, created_by)
      VALUES 
        ('schedule-rent-1', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'rent', 18000.00, 'MXN', 1, true, 3, 'external-admin-1'),
        ('schedule-rent-2', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'rent', 1200.00, 'USD', 1, true, 3, 'external-admin-1'),
        ('schedule-rent-3', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'rent', 15000.00, 'MXN', 15, true, 3, 'external-admin-1'),
        ('schedule-rent-4', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'rent', 1500.00, 'USD', 1, true, 3, 'external-admin-1'),
        ('schedule-rent-5', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'rent', 25000.00, 'MXN', 1, true, 3, 'external-admin-1'),
        ('schedule-rent-6', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'rent', 950.00, 'USD', 5, true, 3, 'external-admin-1'),
        ('schedule-rent-7', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'rent', 28000.00, 'MXN', 1, true, 3, 'external-admin-1'),
        ('schedule-rent-8', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'rent', 1100.00, 'USD', 15, true, 3, 'external-admin-1')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Payment schedules de renta creados');

    await db.execute(sql`
      -- Crear payment schedules para servicios (luz, agua, internet, gas)
      INSERT INTO external_payment_schedules (id, agency_id, contract_id, service_type, amount, currency, day_of_month, is_active, send_reminder_days_before, notes, created_by)
      VALUES 
        -- Contract 1 (unit-101)
        ('schedule-elec-1', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'electricity', 850.00, 'MXN', 22, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-water-1', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'water', 320.00, 'MXN', 25, true, 3, 'Agua bimestral', 'external-admin-1'),
        ('schedule-internet-1', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'internet', 599.00, 'MXN', 10, true, 3, 'Internet Telmex 100Mbps', 'external-admin-1'),
        ('schedule-gas-1', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'gas', 450.00, 'MXN', 28, true, 3, 'Gas LP mensual', 'external-admin-1'),
        -- Contract 2 (unit-201)
        ('schedule-elec-2', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'electricity', 920.00, 'MXN', 22, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-internet-2', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'internet', 899.00, 'MXN', 12, true, 3, 'Internet Totalplay 300Mbps', 'external-admin-1'),
        ('schedule-gas-2', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'gas', 520.00, 'MXN', 28, true, 3, 'Gas LP mensual', 'external-admin-1'),
        -- Contract 3 (unit-a1)
        ('schedule-elec-3', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'electricity', 650.00, 'MXN', 20, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-water-3', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'water', 280.00, 'MXN', 23, true, 3, 'Agua bimestral', 'external-admin-1'),
        ('schedule-internet-3', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'internet', 699.00, 'MXN', 10, true, 3, 'Internet Totalplay 200Mbps', 'external-admin-1'),
        -- Contract 4 (unit-h1)
        ('schedule-elec-4', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'electricity', 780.00, 'MXN', 24, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-water-4', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'water', 300.00, 'MXN', 27, true, 3, 'Agua bimestral', 'external-admin-1'),
        ('schedule-internet-4', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'internet', 799.00, 'MXN', 8, true, 3, 'Internet Izzi 150Mbps', 'external-admin-1'),
        ('schedule-gas-4', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'gas', 480.00, 'MXN', 26, true, 3, 'Gas LP mensual', 'external-admin-1'),
        -- Contract 5 (unit-h2)
        ('schedule-elec-5', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'electricity', 890.00, 'MXN', 21, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-internet-5', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'internet', 999.00, 'MXN', 5, true, 3, 'Internet Starlink', 'external-admin-1'),
        ('schedule-gas-5', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'gas', 550.00, 'MXN', 29, true, 3, 'Gas LP mensual', 'external-admin-1'),
        -- Contract 6 (unit-102)
        ('schedule-elec-6', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'electricity', 720.00, 'MXN', 23, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-water-6', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'water', 290.00, 'MXN', 26, true, 3, 'Agua bimestral', 'external-admin-1'),
        ('schedule-internet-6', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'internet', 599.00, 'MXN', 7, true, 3, 'Internet Telmex 100Mbps', 'external-admin-1'),
        -- Contract 7 (unit-202)
        ('schedule-elec-7', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'electricity', 950.00, 'MXN', 24, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-water-7', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'water', 340.00, 'MXN', 27, true, 3, 'Agua bimestral', 'external-admin-1'),
        ('schedule-internet-7', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'internet', 899.00, 'MXN', 6, true, 3, 'Internet Totalplay 300Mbps', 'external-admin-1'),
        ('schedule-gas-7', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'gas', 580.00, 'MXN', 30, true, 3, 'Gas LP mensual', 'external-admin-1'),
        -- Contract 8 (unit-b1)
        ('schedule-elec-8', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'electricity', 680.00, 'MXN', 21, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-internet-8', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'internet', 699.00, 'MXN', 9, true, 3, 'Internet Totalplay 200Mbps', 'external-admin-1'),
        ('schedule-gas-8', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'gas', 420.00, 'MXN', 25, true, 3, 'Gas LP mensual', 'external-admin-1')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Payment schedules de servicios creados');

    await db.execute(sql`
      -- Crear pagos generados de los schedules (cercanos a noviembre 2025)
      INSERT INTO external_payments (id, agency_id, contract_id, schedule_id, service_type, amount, currency, due_date, status, created_by)
      VALUES 
        -- NOVIEMBRE 2025 - Rentas
        ('pay-rent-1-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-rent-1', 'rent', 18000.00, 'MXN', '2025-11-01', 'paid', 'external-admin-1'),
        ('pay-rent-2-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'schedule-rent-2', 'rent', 1200.00, 'USD', '2025-11-01', 'paid', 'external-admin-1'),
        ('pay-rent-4-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'schedule-rent-4', 'rent', 1500.00, 'USD', '2025-11-01', 'paid', 'external-admin-1'),
        ('pay-rent-5-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'schedule-rent-5', 'rent', 25000.00, 'MXN', '2025-11-01', 'paid', 'external-admin-1'),
        ('pay-rent-7-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'schedule-rent-7', 'rent', 28000.00, 'MXN', '2025-11-01', 'paid', 'external-admin-1'),
        ('pay-rent-6-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'schedule-rent-6', 'rent', 950.00, 'USD', '2025-11-05', 'paid', 'external-admin-1'),
        ('pay-rent-3-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-rent-3', 'rent', 15000.00, 'MXN', '2025-11-15', 'paid', 'external-admin-1'),
        ('pay-rent-8-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'schedule-rent-8', 'rent', 1100.00, 'USD', '2025-11-15', 'paid', 'external-admin-1'),
        
        -- NOVIEMBRE 2025 - Servicios (algunos pagados, otros pendientes)
        ('pay-internet-1-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-internet-1', 'internet', 599.00, 'MXN', '2025-11-10', 'paid', 'external-admin-1'),
        ('pay-internet-3-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-internet-3', 'internet', 699.00, 'MXN', '2025-11-10', 'paid', 'external-admin-1'),
        ('pay-elec-3-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-elec-3', 'electricity', 650.00, 'MXN', '2025-11-20', 'paid', 'external-admin-1'),
        ('pay-elec-8-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'schedule-elec-8', 'electricity', 680.00, 'MXN', '2025-11-21', 'pending', 'external-admin-1'),
        ('pay-elec-5-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'schedule-elec-5', 'electricity', 890.00, 'MXN', '2025-11-21', 'pending', 'external-admin-1'),
        ('pay-elec-1-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-elec-1', 'electricity', 850.00, 'MXN', '2025-11-22', 'pending', 'external-admin-1'),
        ('pay-elec-2-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'schedule-elec-2', 'electricity', 920.00, 'MXN', '2025-11-22', 'pending', 'external-admin-1'),
        ('pay-elec-6-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'schedule-elec-6', 'electricity', 720.00, 'MXN', '2025-11-23', 'pending', 'external-admin-1'),
        ('pay-elec-4-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'schedule-elec-4', 'electricity', 780.00, 'MXN', '2025-11-24', 'pending', 'external-admin-1'),
        ('pay-elec-7-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'schedule-elec-7', 'electricity', 950.00, 'MXN', '2025-11-24', 'pending', 'external-admin-1'),
        ('pay-water-3-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-water-3', 'water', 280.00, 'MXN', '2025-11-23', 'pending', 'external-admin-1'),
        ('pay-water-1-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-water-1', 'water', 320.00, 'MXN', '2025-11-25', 'pending', 'external-admin-1'),
        ('pay-gas-8-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'schedule-gas-8', 'gas', 420.00, 'MXN', '2025-11-25', 'pending', 'external-admin-1'),
        ('pay-water-6-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'schedule-water-6', 'water', 290.00, 'MXN', '2025-11-26', 'pending', 'external-admin-1'),
        ('pay-gas-4-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'schedule-gas-4', 'gas', 480.00, 'MXN', '2025-11-26', 'pending', 'external-admin-1'),
        ('pay-water-4-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'schedule-water-4', 'water', 300.00, 'MXN', '2025-11-27', 'pending', 'external-admin-1'),
        ('pay-water-7-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'schedule-water-7', 'water', 340.00, 'MXN', '2025-11-27', 'pending', 'external-admin-1'),
        ('pay-gas-1-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-gas-1', 'gas', 450.00, 'MXN', '2025-11-28', 'pending', 'external-admin-1'),
        ('pay-gas-2-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'schedule-gas-2', 'gas', 520.00, 'MXN', '2025-11-28', 'pending', 'external-admin-1'),
        ('pay-gas-5-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'schedule-gas-5', 'gas', 550.00, 'MXN', '2025-11-29', 'pending', 'external-admin-1'),
        ('pay-gas-7-nov25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'schedule-gas-7', 'gas', 580.00, 'MXN', '2025-11-30', 'pending', 'external-admin-1'),
        
        -- DICIEMBRE 2025 - Rentas
        ('pay-rent-1-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-rent-1', 'rent', 18000.00, 'MXN', '2025-12-01', 'pending', 'external-admin-1'),
        ('pay-rent-2-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'schedule-rent-2', 'rent', 1200.00, 'USD', '2025-12-01', 'pending', 'external-admin-1'),
        ('pay-rent-4-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'schedule-rent-4', 'rent', 1500.00, 'USD', '2025-12-01', 'pending', 'external-admin-1'),
        ('pay-rent-5-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'schedule-rent-5', 'rent', 25000.00, 'MXN', '2025-12-01', 'pending', 'external-admin-1'),
        ('pay-rent-7-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'schedule-rent-7', 'rent', 28000.00, 'MXN', '2025-12-01', 'pending', 'external-admin-1'),
        ('pay-rent-6-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'schedule-rent-6', 'rent', 950.00, 'USD', '2025-12-05', 'pending', 'external-admin-1'),
        ('pay-rent-3-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-rent-3', 'rent', 15000.00, 'MXN', '2025-12-15', 'pending', 'external-admin-1'),
        ('pay-rent-8-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'schedule-rent-8', 'rent', 1100.00, 'USD', '2025-12-15', 'pending', 'external-admin-1'),
        
        -- DICIEMBRE 2025 - Servicios
        ('pay-internet-4-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'schedule-internet-4', 'internet', 799.00, 'MXN', '2025-12-08', 'pending', 'external-admin-1'),
        ('pay-internet-5-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'schedule-internet-5', 'internet', 999.00, 'MXN', '2025-12-05', 'pending', 'external-admin-1'),
        ('pay-internet-7-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'schedule-internet-7', 'internet', 899.00, 'MXN', '2025-12-06', 'pending', 'external-admin-1'),
        ('pay-internet-6-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'schedule-internet-6', 'internet', 599.00, 'MXN', '2025-12-07', 'pending', 'external-admin-1'),
        ('pay-internet-8-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'schedule-internet-8', 'internet', 699.00, 'MXN', '2025-12-09', 'pending', 'external-admin-1'),
        ('pay-internet-1-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-internet-1', 'internet', 599.00, 'MXN', '2025-12-10', 'pending', 'external-admin-1'),
        ('pay-internet-3-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-internet-3', 'internet', 699.00, 'MXN', '2025-12-10', 'pending', 'external-admin-1'),
        ('pay-internet-2-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'schedule-internet-2', 'internet', 899.00, 'MXN', '2025-12-12', 'pending', 'external-admin-1'),
        ('pay-elec-3-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-elec-3', 'electricity', 650.00, 'MXN', '2025-12-20', 'pending', 'external-admin-1'),
        ('pay-elec-8-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'schedule-elec-8', 'electricity', 680.00, 'MXN', '2025-12-21', 'pending', 'external-admin-1'),
        ('pay-elec-5-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'schedule-elec-5', 'electricity', 890.00, 'MXN', '2025-12-21', 'pending', 'external-admin-1'),
        ('pay-elec-1-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-elec-1', 'electricity', 850.00, 'MXN', '2025-12-22', 'pending', 'external-admin-1'),
        ('pay-elec-2-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'schedule-elec-2', 'electricity', 920.00, 'MXN', '2025-12-22', 'pending', 'external-admin-1'),
        ('pay-elec-6-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'schedule-elec-6', 'electricity', 720.00, 'MXN', '2025-12-23', 'pending', 'external-admin-1'),
        ('pay-water-3-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-water-3', 'water', 280.00, 'MXN', '2025-12-23', 'pending', 'external-admin-1'),
        ('pay-elec-4-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'schedule-elec-4', 'electricity', 780.00, 'MXN', '2025-12-24', 'pending', 'external-admin-1'),
        ('pay-elec-7-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'schedule-elec-7', 'electricity', 950.00, 'MXN', '2025-12-24', 'pending', 'external-admin-1'),
        ('pay-water-1-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-water-1', 'water', 320.00, 'MXN', '2025-12-25', 'pending', 'external-admin-1'),
        ('pay-gas-8-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-8-uuid', 'schedule-gas-8', 'gas', 420.00, 'MXN', '2025-12-25', 'pending', 'external-admin-1'),
        ('pay-water-6-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-6-uuid', 'schedule-water-6', 'water', 290.00, 'MXN', '2025-12-26', 'pending', 'external-admin-1'),
        ('pay-gas-4-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'schedule-gas-4', 'gas', 480.00, 'MXN', '2025-12-26', 'pending', 'external-admin-1'),
        ('pay-water-4-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'schedule-water-4', 'water', 300.00, 'MXN', '2025-12-27', 'pending', 'external-admin-1'),
        ('pay-water-7-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'schedule-water-7', 'water', 340.00, 'MXN', '2025-12-27', 'pending', 'external-admin-1'),
        ('pay-gas-1-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-gas-1', 'gas', 450.00, 'MXN', '2025-12-28', 'pending', 'external-admin-1'),
        ('pay-gas-2-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'schedule-gas-2', 'gas', 520.00, 'MXN', '2025-12-28', 'pending', 'external-admin-1'),
        ('pay-gas-5-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'schedule-gas-5', 'gas', 550.00, 'MXN', '2025-12-29', 'pending', 'external-admin-1'),
        ('pay-gas-7-dec25', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-7-uuid', 'schedule-gas-7', 'gas', 580.00, 'MXN', '2025-12-30', 'pending', 'external-admin-1')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Pagos generados creados');

    // Controles de acceso removidos para simplificar el seed

    console.log("\n🎉 ¡Seed del sistema externo completado!\n");
    console.log("📦 Datos creados:");
    console.log("   • 1 agencia (Mistiq Tulum)");
    console.log("   • 4 usuarios externos");
    console.log("   • 3 condominios");
    console.log("   • 10 unidades");
    console.log("   • 7 propietarios");
    console.log("   • 8 contratos de renta activos");
    console.log("   • 35 payment schedules (8 rentas + 27 servicios)");
    console.log("   • 70+ pagos generados (nov 20-dic 2025)");
    console.log("   • Fechas actualizadas para visualización cercana a HOY\n");

  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedExternalSystem();
