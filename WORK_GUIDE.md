# Guía de Trabajo Eficiente con Replit Agent - HomesApp

## 🎯 Cómo Solicitar Features Efectivamente

### Estructura Ideal de Solicitud

```markdown
[FEATURE]: Nombre descriptivo

[CONTEXTO]: 
- Roles involucrados: (e.g., admin, tenant, owner)
- Flujos existentes que se conectan: (e.g., "usa el sistema de properties existente")
- Datos que necesita: (e.g., "relacionado con la tabla properties")

[REQUISITOS]:
1. Schema changes necesarios
2. Permisos/roles requeridos
3. UI components (describe la UX esperada)
4. Integraciones con features existentes

[EJEMPLO DE USO]:
- Como [rol], quiero [acción] para [beneficio]
```

### Ejemplos de Solicitudes Efectivas

#### ✅ EXCELENTE
```
Quiero agregar sistema de pagos mensuales para inquilinos.

CONTEXTO:
- Ya existe el sistema de rentas activas (rental_contracts)
- Roles: tenant (paga), owner (recibe), admin (administra)
- Relacionado con: properties, users, rental_contracts

REQUISITOS:
1. Nueva tabla: monthly_payments (contractId, amount, dueDate, status, paidDate)
2. Solo tenants pueden ver sus pagos, owners pueden aprobar, admins pueden todo
3. UI: Panel para tenant con lista de pagos pendientes/completados
4. Notificaciones cuando un pago está próximo a vencer
5. Integrar con el panel de rentas activas existente

VALIDACIÓN:
- Asegúrate que funcione con el flujo de rentas actual
- Debe respetar i18n (español/inglés)
- Incluye data-testid para testing
```

#### ❌ EVITA
```
"Agrega pagos"
```
*Problema: Muy vago, falta contexto de integración*

---

## 🔄 Workflow Recomendado para Features Grandes

### Fase 1: Planificación (Hazlo tú primero)
1. Revisa `replit.md` para entender el sistema actual
2. Identifica puntos de integración
3. Define los roles involucrados
4. Esboza el flujo de usuario

### Fase 2: Solicitud al Agent
```
"Antes de implementar, quiero que revises el proyecto y me des 
un plan de implementación para [feature]. Usa search_codebase 
para entender cómo funciona [sistema relacionado]."
```

### Fase 3: Implementación Incremental
No pidas todo de una vez. Divide así:

**Sprint 1: Foundation**
- Schema + migrations
- Storage interface
- API básica

**Sprint 2: Core Feature**
- UI principal
- Integraciones críticas
- Validaciones

**Sprint 3: Polish**
- Notificaciones
- Edge cases
- Testing completo

---

## 📋 Checklist Pre-Solicitud

Antes de pedir una feature, verifica:

- [ ] ¿Leíste `replit.md` para entender el contexto?
- [ ] ¿Identificaste las tablas/schemas relacionadas?
- [ ] ¿Sabes qué roles necesitan acceso?
- [ ] ¿Entiendes cómo se integra con features existentes?
- [ ] ¿Defines la UX esperada?
- [ ] ¿Mencionaste requisitos de i18n si aplica?

---

## 🚨 Errores Comunes y Cómo Evitarlos

### Error 1: "La feature no se integra bien"
**Causa**: No revisar código existente antes de solicitar
**Solución**: Pide primero: "Busca en el código cómo funciona [feature relacionada]"

### Error 2: "Falta autenticación/permisos"
**Causa**: No especificar roles en la solicitud
**Solución**: Siempre menciona: "Esta feature es para rol X, requiere permisos Y"

### Error 3: "El schema no coincide"
**Causa**: Pedir cambios sin revisar shared/schema.ts
**Solución**: "Revisa shared/schema.ts y actualiza según sea necesario"

### Error 4: "El frontend no tiene datos"
**Causa**: No coordinar backend y frontend
**Solución**: Pide "implementación completa end-to-end" y valida con testing

### Error 5: "Falta i18n/traducciones"
**Causa**: No especificar soporte bilingüe
**Solución**: Menciona: "Debe soportar español/inglés según el sistema i18n actual"

---

## 🎨 Patrones de Diseño del Proyecto

### 1. Autenticación
- Usar: `isAuthenticated` y `requireRole` middleware
- Roles disponibles: master, admin, admin_jr, seller, owner, tenant, hoa_manager

### 2. Formularios
```typescript
// SIEMPRE usar este patrón:
- useForm + zodResolver
- Form + FormField de shadcn
- Validación con schemas de drizzle-zod
- data-testid en todos los inputs
```

### 3. Queries y Mutations
```typescript
// SIEMPRE:
- useQuery para fetch
- useMutation para POST/PATCH/DELETE
- queryClient.invalidateQueries después de mutaciones
- Usar queryKey en array: ['/api/resource', id]
```

### 4. Traducciones
```typescript
// Ubicación: client/src/lib/translations/
// Patrón: { es: { ... }, en: { ... } }
// Uso: const t = translations[language]
```

### 5. Rutas API
```typescript
// Patrón establecido:
// GET    /api/resource
// GET    /api/resource/:id
// POST   /api/resource
// PATCH  /api/resource/:id
// DELETE /api/resource/:id
```

---

## 🧪 Testing y Validación

### Después de cada feature, solicita:
```
"Ahora haz testing end-to-end de esta feature para validar:
1. El flujo completo funciona
2. Los permisos son correctos
3. La UI muestra los datos correctamente
4. Las traducciones funcionan
5. No hay errores en console"
```

### Para features críticas:
```
"Llama al architect para revisar la implementación de [feature]
y asegurar que sigue las mejores prácticas del proyecto"
```

---

## 💡 Tips Avanzados

### 1. Reutiliza Componentes Existentes
```
"Revisa qué componentes similares existen antes de crear nuevos.
Por ejemplo, usa el mismo patrón de [componente existente]"
```

### 2. Mantén Consistencia Visual
```
"Usa el mismo estilo que [página existente], con Cards, Badges,
y el mismo esquema de colores"
```

### 3. Documenta Decisiones Importantes
```
Después de features grandes, actualiza replit.md con:
- Nueva funcionalidad agregada
- Flujos de trabajo importantes
- Decisiones de arquitectura
```

### 4. Usa el Architect para Planificación
```
"Antes de implementar, usa el architect tool para crear un plan
de implementación detallado de [feature compleja]"
```

---

## 📚 Recursos del Proyecto

### Archivos Clave para Revisar
- `replit.md` - Documentación general y arquitectura
- `shared/schema.ts` - Todos los modelos de datos
- `server/storage.ts` - Interface de acceso a datos
- `server/routes.ts` - Todos los endpoints API
- `client/src/App.tsx` - Rutas y navegación principal
- `client/src/lib/translations/` - Sistema i18n

### Comandos Útiles
```bash
# Actualizar schema de BD
npm run db:push

# Si falla, forzar
npm run db:push --force

# Ver logs
npm run dev
```

---

## 🤝 Comunicación Efectiva con el Agent

### ✅ HACER:
- Proporcionar contexto completo
- Mencionar integraciones con código existente
- Especificar roles y permisos
- Describir la UX esperada
- Solicitar validación después de cambios
- Usar el architect para features complejas

### ❌ EVITAR:
- Solicitudes vagas sin contexto
- Pedir "todo de una vez" en features grandes
- Asumir que recuerdo sesiones anteriores
- Olvidar mencionar requisitos de i18n
- No validar la integración con código existente

---

## 🎯 Plantilla Rápida de Solicitud

Copia y completa esto para solicitudes efectivas:

```markdown
## [NOMBRE DE FEATURE]

### Contexto
- Roles: [admin/owner/tenant/etc]
- Integra con: [features existentes]
- Objetivo: [para qué sirve]

### Schema Necesario
- Tabla: [nombre]
- Campos: [lista]
- Relaciones: [con qué tablas]

### API Endpoints
- GET/POST/PATCH/DELETE [rutas necesarias]
- Permisos: [qué roles pueden hacer qué]

### UI/UX
- Página principal: [dónde se accede]
- Componentes: [formularios, listas, modals, etc]
- Flujo de usuario: [paso a paso]

### Validación
- [ ] Funciona end-to-end
- [ ] Permisos correctos
- [ ] i18n implementado
- [ ] data-testid agregados
- [ ] Sin errores en console

### Testing
[Describe escenarios de prueba principales]
```

---

**Recuerda**: Entre sesiones pierdo todo el contexto. `replit.md` y documentación clara son tu mejor aliado para trabajo eficiente.
