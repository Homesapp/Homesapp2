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
      INSERT INTO external_agencies (id, name, contact_email, contact_phone, address, created_by)
      VALUES 
        ('d7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Mistiq Tulum', 'admin@mistiqtulum.com', '+52 984 123 4567', 'Av. Tulum, Tulum, Q.Roo', 'external-admin-1')
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
      INSERT INTO external_units (id, condominium_id, agency_id, unit_number, bedrooms, bathrooms, area_sqm, created_by)
      VALUES 
        ('unit-101-uuid', 'condo-1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', '101', 2, 2, 85.5, 'external-admin-1'),
        ('unit-102-uuid', 'condo-1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', '102', 2, 2, 85.5, 'external-admin-1'),
        ('unit-201-uuid', 'condo-1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', '201', 3, 2, 110.0, 'external-admin-1'),
        ('unit-202-uuid', 'condo-1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', '202', 3, 2, 110.0, 'external-admin-1'),
        ('unit-a1-uuid', 'condo-2-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'A1', 1, 1, 55.0, 'external-admin-1'),
        ('unit-a2-uuid', 'condo-2-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'A2', 1, 1, 55.0, 'external-admin-1'),
        ('unit-b1-uuid', 'condo-2-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'B1', 2, 1, 75.0, 'external-admin-1'),
        ('unit-h1-uuid', 'condo-3-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'H1', 2, 2, 90.0, 'external-admin-1'),
        ('unit-h2-uuid', 'condo-3-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'H2', 2, 2, 90.0, 'external-admin-1'),
        ('unit-h3-uuid', 'condo-3-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'H3', 3, 2, 120.0, 'external-admin-1')
      ON CONFLICT (id) DO UPDATE SET 
        unit_number = EXCLUDED.unit_number,
        bedrooms = EXCLUDED.bedrooms;
    `);
    console.log('✅ Unidades externas creadas');

    await db.execute(sql`
      -- Crear propietarios de unidades
      INSERT INTO external_unit_owners (id, unit_id, agency_id, name, email, phone, created_by)
      VALUES 
        ('owner-ext-1', 'unit-101-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Carlos Martínez', 'carlos.martinez@email.com', '+52 998 111 1111', 'external-admin-1'),
        ('owner-ext-2', 'unit-201-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Ana López', 'ana.lopez@email.com', '+52 998 222 2222', 'external-admin-1'),
        ('owner-ext-3', 'unit-a1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Roberto Sánchez', 'roberto.sanchez@email.com', '+52 998 333 3333', 'external-admin-1'),
        ('owner-ext-4', 'unit-h1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Laura Hernández', 'laura.hernandez@email.com', '+52 998 444 4444', 'external-admin-1')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Propietarios de unidades creados');

    await db.execute(sql`
      -- Crear contratos de renta
      INSERT INTO external_rental_contracts (id, unit_id, agency_id, tenant_name, tenant_email, tenant_phone, monthly_rent, currency, lease_duration_months, start_date, end_date, status, created_by)
      VALUES 
        ('contract-1-uuid', 'unit-101-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Laura Martínez', 'laura.m@email.com', '+52 998 555 1111', 18000.00, 'MXN', 12, '2024-10-01', '2025-10-01', 'active', 'external-admin-1'),
        ('contract-2-uuid', 'unit-201-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Michael Smith', 'michael.smith@email.com', '+1 555 222 3333', 1200.00, 'USD', 6, '2024-11-01', '2025-05-01', 'active', 'external-admin-1'),
        ('contract-3-uuid', 'unit-a1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Carmen Rodríguez', 'carmen.r@email.com', '+52 998 666 2222', 22000.00, 'MXN', 12, '2024-08-15', '2025-08-15', 'active', 'external-admin-1'),
        ('contract-4-uuid', 'unit-h1-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'Sophie Dubois', 'sophie.d@email.com', '+33 6 12 34 56 78', 1500.00, 'USD', 24, '2024-09-01', '2026-09-01', 'active', 'external-admin-1'),
        ('contract-5-uuid', 'unit-h2-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'José García López', 'jose.garcia@email.com', '+52 998 777 3333', 25000.00, 'MXN', 12, '2024-06-01', '2025-06-01', 'active', 'external-admin-1')
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
        ('schedule-rent-3', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'rent', 22000.00, 'MXN', 15, true, 3, 'external-admin-1'),
        ('schedule-rent-4', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-4-uuid', 'rent', 1500.00, 'USD', 1, true, 3, 'external-admin-1'),
        ('schedule-rent-5', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-5-uuid', 'rent', 25000.00, 'MXN', 1, true, 3, 'external-admin-1')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Payment schedules de renta creados');

    await db.execute(sql`
      -- Crear payment schedules para servicios (luz, agua, internet)
      INSERT INTO external_payment_schedules (id, agency_id, contract_id, service_type, amount, currency, day_of_month, is_active, send_reminder_days_before, notes, created_by)
      VALUES 
        ('schedule-elec-1', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'electricity', 800.00, 'MXN', 5, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-water-1', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'water', 300.00, 'MXN', 5, true, 3, 'Agua bimestral', 'external-admin-1'),
        ('schedule-internet-1', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'internet', 599.00, 'MXN', 10, true, 3, 'Internet Telmex 100Mbps', 'external-admin-1'),
        ('schedule-elec-2', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'electricity', 650.00, 'MXN', 5, true, 3, 'CFE estimado mensual', 'external-admin-1'),
        ('schedule-internet-2', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'internet', 699.00, 'MXN', 10, true, 3, 'Internet Totalplay 200Mbps', 'external-admin-1')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Payment schedules de servicios creados');

    await db.execute(sql`
      -- Crear pagos generados de los schedules (últimos 2 meses + próximos 2 meses)
      INSERT INTO external_payments (id, agency_id, contract_id, schedule_id, service_type, amount, currency, due_date, status, created_by)
      VALUES 
        -- Contract 1 - Renta (día 1)
        ('pay-rent-1-nov', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-rent-1', 'rent', 18000.00, 'MXN', '2024-11-01', 'paid', 'external-admin-1'),
        ('pay-rent-1-dec', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-rent-1', 'rent', 18000.00, 'MXN', '2024-12-01', 'pending', 'external-admin-1'),
        ('pay-rent-1-jan', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-rent-1', 'rent', 18000.00, 'MXN', '2025-01-01', 'pending', 'external-admin-1'),
        -- Contract 1 - Servicios
        ('pay-elec-1-nov', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-elec-1', 'electricity', 800.00, 'MXN', '2024-11-05', 'paid', 'external-admin-1'),
        ('pay-elec-1-dec', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-elec-1', 'electricity', 800.00, 'MXN', '2024-12-05', 'pending', 'external-admin-1'),
        ('pay-internet-1-nov', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-internet-1', 'internet', 599.00, 'MXN', '2024-11-10', 'paid', 'external-admin-1'),
        ('pay-internet-1-dec', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-1-uuid', 'schedule-internet-1', 'internet', 599.00, 'MXN', '2024-12-10', 'pending', 'external-admin-1'),
        -- Contract 2 - Renta USD
        ('pay-rent-2-nov', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'schedule-rent-2', 'rent', 1200.00, 'USD', '2024-11-01', 'paid', 'external-admin-1'),
        ('pay-rent-2-dec', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-2-uuid', 'schedule-rent-2', 'rent', 1200.00, 'USD', '2024-12-01', 'pending', 'external-admin-1'),
        -- Contract 3 - Renta día 15
        ('pay-rent-3-oct', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-rent-3', 'rent', 22000.00, 'MXN', '2024-10-15', 'paid', 'external-admin-1'),
        ('pay-rent-3-nov', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-rent-3', 'rent', 22000.00, 'MXN', '2024-11-15', 'paid', 'external-admin-1'),
        ('pay-rent-3-dec', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-rent-3', 'rent', 22000.00, 'MXN', '2024-12-15', 'pending', 'external-admin-1'),
        ('pay-elec-3-nov', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-elec-2', 'electricity', 650.00, 'MXN', '2024-11-05', 'paid', 'external-admin-1'),
        ('pay-elec-3-dec', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'contract-3-uuid', 'schedule-elec-2', 'electricity', 650.00, 'MXN', '2024-12-05', 'pending', 'external-admin-1')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Pagos generados creados');

    await db.execute(sql`
      -- Crear controles de acceso
      INSERT INTO external_unit_access_controls (id, unit_id, agency_id, access_type, name, value, notes, created_by)
      VALUES 
        ('access-wifi-101', 'unit-101-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'wifi', 'WiFi Principal', 'AldeaZama_101 / Pass2024!', 'Router en sala', 'external-admin-1'),
        ('access-door-101', 'unit-101-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'door_code', 'Puerta Principal', '1234#', 'Código temporal', 'external-admin-1'),
        ('access-gate-101', 'unit-101-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'gate', 'Caseta Principal', 'Registro de visitantes', 'Horario 24/7', 'external-admin-1'),
        ('access-wifi-201', 'unit-201-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'wifi', 'WiFi Residencial', 'AldeaZama_201 / Secure2024', 'Router en recámara principal', 'external-admin-1'),
        ('access-parking-201', 'unit-201-uuid', 'd7ce1ca9-0763-4faf-9d26-889e1f8d2a51', 'parking', 'Estacionamiento', 'Cajón P-15', 'Nivel -1', 'external-admin-1')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Controles de acceso creados');

    console.log("\n🎉 ¡Seed del sistema externo completado!\n");
    console.log("📦 Datos creados:");
    console.log("   • 1 agencia (Mistiq Tulum)");
    console.log("   • 4 usuarios externos");
    console.log("   • 3 condominios");
    console.log("   • 10 unidades");
    console.log("   • 4 propietarios");
    console.log("   • 5 contratos de renta");
    console.log("   • 10 payment schedules (5 rentas + 5 servicios)");
    console.log("   • 14 pagos generados");
    console.log("   • 5 controles de acceso\n");

  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedExternalSystem();
