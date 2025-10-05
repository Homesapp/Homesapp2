import { db } from "./db";
import { sql } from "drizzle-orm";

async function seedDatabase() {
  console.log("🌱 Iniciando seed de la base de datos...");

  try {
    await db.execute(sql`
      -- Crear usuarios de prueba con diferentes roles
      INSERT INTO users (id, email, first_name, last_name, role, status, phone, bio)
      VALUES 
        ('master-user-1', 'master@homesapp.com', 'Master', 'Admin', 'master', 'approved', '+52 998 123 4567', 'Administrador maestro del sistema'),
        ('admin-user-1', 'admin@homesapp.com', 'Carlos', 'Administrador', 'admin', 'approved', '+52 998 234 5678', 'Administrador del sistema'),
        ('client-user-1', 'maria.cliente@gmail.com', 'María', 'García', 'cliente', 'approved', '+52 998 345 6789', 'Buscando un departamento en Tulum'),
        ('client-user-2', 'juan.cliente@gmail.com', 'Juan', 'Pérez', 'cliente', 'approved', '+52 998 456 7890', 'Interesado en rentar una casa cerca de la playa'),
        ('client-user-3', 'ana.cliente@gmail.com', 'Ana', 'Rodríguez', 'cliente', 'approved', '+52 998 567 8901', 'Buscando una villa de lujo para comprar'),
        ('owner-user-1', 'roberto.owner@gmail.com', 'Roberto', 'Propietario', 'owner', 'approved', '+52 998 678 9012', 'Propietario de varias propiedades en Tulum'),
        ('owner-user-2', 'laura.owner@gmail.com', 'Laura', 'Méndez', 'owner', 'approved', '+52 998 789 0123', 'Inversionista inmobiliaria'),
        ('seller-user-1', 'diego.seller@homesapp.com', 'Diego', 'Vendedor', 'seller', 'approved', '+52 998 890 1234', 'Agente de ventas especializado en propiedades de lujo'),
        ('provider-user-1', 'jose.provider@gmail.com', 'José', 'Plomero', 'provider', 'approved', '+52 998 901 2345', 'Plomero profesional con 15 años de experiencia'),
        ('provider-user-2', 'carmen.provider@gmail.com', 'Carmen', 'Limpieza', 'provider', 'approved', '+52 998 012 3456', 'Servicio de limpieza profesional'),
        ('concierge-user-1', 'pedro.concierge@homesapp.com', 'Pedro', 'Conserje', 'concierge', 'approved', '+52 998 123 4568', 'Conserje especializado en recorridos de propiedades'),
        ('abogado-user-1', 'lic.martinez@gmail.com', 'Lic. Ricardo', 'Martínez', 'abogado', 'approved', '+52 998 234 5679', 'Abogado especializado en bienes raíces'),
        ('contador-user-1', 'cp.sanchez@gmail.com', 'CP. Sofia', 'Sánchez', 'contador', 'approved', '+52 998 345 6780', 'Contadora pública certificada')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Usuarios creados');

    await db.execute(sql`
      -- Crear colonias (UPSERT para asegurar IDs consistentes)
      INSERT INTO colonies (id, name, slug, active)
      VALUES 
        ('col-centro', 'Centro de Tulum', 'centro-tulum', true),
        ('col-aldea-zama', 'Aldea Zamá', 'aldea-zama', true),
        ('col-la-veleta', 'La Veleta', 'la-veleta', true),
        ('col-region-15', 'Región 15', 'region-15', true)
      ON CONFLICT (slug) DO UPDATE SET 
        id = EXCLUDED.id,
        name = EXCLUDED.name,
        active = EXCLUDED.active;
    `);
    console.log('✅ Colonias creadas');

    await db.execute(sql`
      -- Crear condominios (UPSERT para asegurar IDs consistentes)
      INSERT INTO condominiums (id, name, approval_status)
      VALUES 
        ('cond-maya-luxury', 'Maya Luxury Residences', 'approved'),
        ('cond-tulum-gardens', 'Tulum Gardens', 'approved')
      ON CONFLICT (name) DO UPDATE SET 
        id = EXCLUDED.id,
        approval_status = EXCLUDED.approval_status;
    `);
    console.log('✅ Condominios creados');

    await db.execute(sql`
      -- Crear propiedades
      INSERT INTO properties (
        id, title, description, price, currency, location, bedrooms, bathrooms, area,
        property_type, status, amenities, owner_id, approval_status, featured, colony_id, condominium_id
      )
      VALUES 
        (
          'prop-1', 'Penthouse de Lujo Frente al Mar',
          'Increíble penthouse con vista panorámica al mar Caribe',
          8500000, 'MXN', 'Zona Hotelera, Tulum', 3, 3, 250,
          'departamento', 'both', ARRAY['Alberca', 'Gym', 'Seguridad 24/7', 'Vista al mar', 'Terraza'],
          'owner-user-1', 'published', true, 'col-aldea-zama', 'cond-maya-luxury'
        ),
        (
          'prop-2', 'Casa Ecológica en La Veleta',
          'Hermosa casa sustentable con paneles solares',
          4200000, 'MXN', 'La Veleta, Tulum', 2, 2, 180,
          'casa', 'sale', ARRAY['Paneles solares', 'Jardín', 'Cisterna', 'Parking'],
          'owner-user-1', 'published', true, 'col-la-veleta', NULL
        ),
        (
          'prop-3', 'Departamento Moderno en Aldea Zamá',
          'Departamento completamente equipado en el mejor desarrollo',
          35000, 'MXN', 'Aldea Zamá, Tulum', 2, 2, 120,
          'departamento', 'rent', ARRAY['Alberca', 'Gym', 'Coworking', 'Seguridad'],
          'owner-user-2', 'published', true, 'col-aldea-zama', NULL
        ),
        (
          'prop-4', 'Villa de Lujo con Alberca Privada',
          'Espectacular villa de 4 recámaras con alberca privada',
          12000000, 'MXN', 'Aldea Zamá, Tulum', 4, 4, 350,
          'casa', 'sale', ARRAY['Alberca privada', 'Jardín', 'BBQ', 'Parking', 'Bodega'],
          'owner-user-2', 'published', false, 'col-aldea-zama', NULL
        ),
        (
          'prop-5', 'Estudio Amueblado en Centro',
          'Estudio compacto y funcional, completamente amueblado',
          18000, 'MXN', 'Centro, Tulum', 1, 1, 45,
          'departamento', 'rent', ARRAY['Amueblado', 'Internet', 'Cocina equipada'],
          'owner-user-1', 'published', false, 'col-centro', NULL
        )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Propiedades creadas');

    await db.execute(sql`
      -- Crear leads
      INSERT INTO leads (id, first_name, last_name, email, phone, source, budget, notes, status)
      VALUES 
        ('lead-1', 'Patricia', 'López', 'patricia.lopez@gmail.com', '+52 998 111 2222', 'Facebook Ads', 65000, 'Interesada en rentar un departamento de 2 recámaras. Presupuesto: 50000-80000 MXN/mes', 'nuevo'),
        ('lead-2', 'Miguel', 'Torres', 'miguel.torres@gmail.com', '+52 998 222 3333', 'Google', 6500000, 'Busca comprar casa en Aldea Zamá. Presupuesto: 5-8 millones MXN', 'contactado'),
        ('lead-3', 'Daniela', 'Hernández', 'daniela.hernandez@gmail.com', '+52 998 333 4444', 'Referido', 35000, 'Necesita mudarse en 2 semanas. Presupuesto: 30000-40000 MXN/mes', 'calificado'),
        ('lead-4', 'Alberto', 'Ramírez', 'alberto.ramirez@gmail.com', '+52 998 444 5555', 'Instagram', 12500000, 'Inversionista buscando propiedades de lujo. Presupuesto: 10-15 millones MXN', 'visita_agendada'),
        ('lead-5', 'Gabriela', 'Morales', 'gabriela.morales@gmail.com', '+52 998 555 6666', 'Website', 22500, 'Prefiere zona cerca del centro. Presupuesto: 20000-25000 MXN/mes', 'en_negociacion')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Leads creados');

    await db.execute(sql`
      -- Crear citas
      INSERT INTO appointments (
        id, property_id, client_id, date, type, status, notes, concierge_id, owner_approval_status
      )
      VALUES 
        ('appt-1', 'prop-1', 'client-user-1', NOW() + INTERVAL '2 days' + INTERVAL '10 hours', 'in-person', 'confirmed', 'Primera visita, interesada en conocer el penthouse', 'concierge-user-1', 'approved'),
        ('appt-2', 'prop-3', 'client-user-2', NOW() + INTERVAL '3 days' + INTERVAL '15 hours', 'video', 'pending', 'Prefiere videollamada inicial', 'concierge-user-1', 'pending'),
        ('appt-3', 'prop-4', 'client-user-3', NOW() + INTERVAL '5 days' + INTERVAL '11 hours', 'in-person', 'confirmed', 'Busca villa familiar', 'concierge-user-1', 'approved')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Citas creadas');

    await db.execute(sql`
      -- Crear ofertas
      INSERT INTO offers (id, property_id, client_id, appointment_id, offer_amount, status, notes)
      VALUES 
        ('offer-1', 'prop-2', 'client-user-1', 'appt-1', 4000000, 'pending', 'Oferta inicial por la casa ecológica. Pago de contado, sin financiamiento'),
        ('offer-2', 'prop-4', 'client-user-3', NULL, 11500000, 'countered', 'Oferta por la villa. 50% enganche, 50% a 6 meses'),
        ('offer-3', 'prop-1', 'client-user-2', NULL, 8200000, 'under-review', 'Oferta competitiva por el penthouse. Pago de contado')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Ofertas creadas');

    await db.execute(sql`
      -- Actualizar conteofertas
      UPDATE offers SET counter_offer_amount = 11800000, counter_offer_notes = 'Contraoferta del propietario' WHERE id = 'offer-2';
    `);

    await db.execute(sql`
      -- Crear proveedores de servicios
      INSERT INTO service_providers (id, user_id, specialty, rating, review_count, available)
      VALUES 
        ('sp-1', 'provider-user-1', 'Plomería', 4.8, 24, true),
        ('sp-2', 'provider-user-2', 'Limpieza', 4.9, 45, true)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Proveedores de servicios creados');

    await db.execute(sql`
      -- Crear servicios
      INSERT INTO services (id, provider_id, name, description, price, currency)
      VALUES 
        ('serv-1', 'sp-1', 'Reparación de fugas', 'Detección y reparación de fugas de agua en plomería residencial', 800, 'MXN'),
        ('serv-2', 'sp-1', 'Instalación de calentador', 'Instalación completa de calentador de agua con garantía', 2500, 'MXN'),
        ('serv-3', 'sp-2', 'Limpieza profunda', 'Limpieza completa de casa o departamento incluye baños, cocina y habitaciones', 1200, 'MXN'),
        ('serv-4', 'sp-2', 'Limpieza express', 'Limpieza rápida de mantenimiento semanal o quincenal', 600, 'MXN')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Servicios creados');

    await db.execute(sql`
      -- Crear reservas de servicios
      INSERT INTO service_bookings (id, service_id, client_id, property_id, provider_id, scheduled_date, status, notes)
      VALUES 
        ('booking-1', 'serv-1', 'client-user-1', 'prop-3', 'sp-1', NOW() + INTERVAL '2 days', 'confirmed', 'Fuga en el baño principal'),
        ('booking-2', 'serv-3', 'client-user-2', 'prop-5', 'sp-2', NOW() + INTERVAL '1 day', 'pending', 'Limpieza antes de mudanza')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Reservas de servicios creadas');

    await db.execute(sql`
      -- Crear presentation cards
      INSERT INTO presentation_cards (
        id, client_id, min_price, max_price, bedrooms, bathrooms, location,
        property_type, modality, amenities, has_pets, additional_requirements
      )
      VALUES 
        ('pc-1', 'client-user-1', 30000, 50000, 2, 2, 'Aldea Zamá', 'departamento', 'rent', ARRAY['Alberca', 'Gym'], false, 'Cerca de supermercados'),
        ('pc-2', 'client-user-3', 10000000, 15000000, 4, 3, 'Aldea Zamá', 'casa', 'sale', ARRAY['Alberca privada', 'Jardín', 'Seguridad'], true, 'Vista al mar o jardín grande')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Presentation cards creadas');

    await db.execute(sql`
      -- Crear aplicaciones de renta
      INSERT INTO rental_applications (
        id, property_id, applicant_id, status, move_in_date, monthly_income, employment_status, notes
      )
      VALUES 
        ('rental-1', 'prop-3', 'client-user-1', 'revision_documentos', NOW() + INTERVAL '30 days', 60000, 'Empleado remoto', 'Contrato de trabajo disponible. Referencias: Juan Pérez, María López'),
        ('rental-2', 'prop-5', 'client-user-2', 'solicitud_enviada', NOW() + INTERVAL '15 days', 45000, 'Freelancer', 'Últimos 3 recibos de ingresos disponibles. Referencia: Ana Gómez')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Aplicaciones de renta creadas');

    await db.execute(sql`
      -- Crear conversaciones de chat
      INSERT INTO chat_conversations (id, type, title, property_id, rental_application_id, created_by_id, is_bot, last_message_at)
      VALUES 
        ('conv-1', 'appointment', 'Cita - Penthouse Frente al Mar', 'prop-1', NULL, 'client-user-1', false, NOW() - INTERVAL '1 hour'),
        ('conv-2', 'rental', 'Renta - Departamento Aldea Zamá', 'prop-3', 'rental-1', 'client-user-1', false, NOW() - INTERVAL '2 hours'),
        ('conv-3', 'support', 'Asistente Virtual - María García', NULL, NULL, 'client-user-1', true, NOW() - INTERVAL '30 minutes'),
        ('conv-4', 'internal', 'Coordinación - Villa Familiar', 'prop-4', NULL, 'seller-user-1', false, NOW() - INTERVAL '4 hours')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Conversaciones creadas');

    await db.execute(sql`
      -- Crear participantes de conversaciones
      INSERT INTO chat_participants (conversation_id, user_id)
      VALUES 
        ('conv-1', 'client-user-1'),
        ('conv-1', 'concierge-user-1'),
        ('conv-1', 'owner-user-1'),
        ('conv-2', 'client-user-1'),
        ('conv-2', 'owner-user-2'),
        ('conv-3', 'client-user-1'),
        ('conv-4', 'seller-user-1'),
        ('conv-4', 'admin-user-1')
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    `);
    console.log('✅ Participantes de conversaciones creados');

    await db.execute(sql`
      -- Crear mensajes de chat
      INSERT INTO chat_messages (conversation_id, sender_id, message, is_bot)
      VALUES 
        ('conv-1', 'client-user-1', 'Hola, me gustaría agendar una visita para ver el penthouse', false),
        ('conv-1', 'concierge-user-1', '¡Hola María! Con gusto te agendo una visita. ¿Qué día te viene mejor?', false),
        ('conv-1', 'client-user-1', 'El próximo martes por la mañana estaría perfecto', false),
        ('conv-2', 'client-user-1', 'Hola, envié mi aplicación de renta. ¿Qué documentos adicionales necesitan?', false),
        ('conv-2', 'owner-user-2', 'Hola María, necesitamos tus últimos 3 recibos de nómina y una identificación oficial', false),
        ('conv-3', 'client-user-1', 'Hola, estoy buscando un departamento de 2 recámaras en Aldea Zamá', false),
        ('conv-3', 'client-user-1', '¡Hola María! Claro que sí, tengo varias opciones que podrían interesarte. ¿Cuál es tu presupuesto aproximado?', true),
        ('conv-4', 'seller-user-1', 'Tenemos una cliente muy interesada en la Villa Familiar', false);
    `);
    console.log('✅ Mensajes de chat creados');

    await db.execute(sql`
      -- Crear notificaciones
      INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, read)
      VALUES 
        ('client-user-1', 'appointment', 'Cita Confirmada', 'Tu cita para visitar el Penthouse Frente al Mar ha sido confirmada', 'appointment', 'appt-1', false),
        ('owner-user-2', 'offer', 'Nueva Oferta', 'Recibiste una nueva oferta por tu propiedad Villa de Lujo', 'offer', 'offer-2', false),
        ('client-user-1', 'rental_update', 'Aplicación en Revisión', 'Tu aplicación de renta está siendo revisada', 'rental_application', 'rental-1', true);
    `);
    console.log('✅ Notificaciones creadas');

    await db.execute(sql`
      -- Crear favoritos
      INSERT INTO favorites (user_id, property_id)
      VALUES 
        ('client-user-1', 'prop-1'),
        ('client-user-1', 'prop-3'),
        ('client-user-2', 'prop-4'),
        ('client-user-3', 'prop-1'),
        ('client-user-3', 'prop-4')
      ON CONFLICT (user_id, property_id) DO NOTHING;
    `);
    console.log('✅ Favoritos creados');

    console.log("\n🎉 ¡Seed completado exitosamente!\n");
    console.log("📝 Datos creados:");
    console.log("   • 13 usuarios (diferentes roles)");
    console.log("   • 4 colonias");
    console.log("   • 2 condominios");
    console.log("   • 5 propiedades");
    console.log("   • 5 leads");
    console.log("   • 3 citas");
    console.log("   • 3 ofertas");
    console.log("   • 2 proveedores de servicios");
    console.log("   • 4 servicios");
    console.log("   • 2 reservas de servicios");
    console.log("   • 2 presentation cards");
    console.log("   • 2 aplicaciones de renta");
    console.log("   • 4 conversaciones de chat");
    console.log("   • 3 notificaciones");
    console.log("   • 5 favoritos\n");

  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedDatabase();
