# CLAUDE.md

## Contexto del proyecto

Este proyecto es una aplicación SaaS de calendario y gestión de turnos orientada a negocios como:

- centros de estética
- barberías
- peluquerías
- salones
- profesionales independientes con agenda

El objetivo principal es permitir administrar:

- agenda diaria/semanal
- profesionales
- servicios
- clientes
- disponibilidad
- métricas básicas del negocio
- configuración general del negocio

La app debe sentirse **profesional, simple, rápida y moderna**, con una UI unisex, limpia y sin colores chillones.

---

## Stack principal

### Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router
- date-fns
- Lucide React

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM

### Base de datos
- PostgreSQL o SQLite en desarrollo, según entorno
- Prisma como capa de acceso

---

## Principios generales de desarrollo

1. **No romper la UX actual**
   - Antes de refactorizar, entender cómo funciona el flujo completo.
   - Mantener consistencia visual y funcional.

2. **Priorizar claridad por sobre “magia”**
   - Código explícito.
   - Nombres claros.
   - Evitar abstracciones innecesarias.

3. **Pensar como producto SaaS**
   - Todo debe ser reutilizable para múltiples tipos de negocio similares.
   - Evitar lógica hardcodeada para un solo caso.

4. **Mantener el tipado fuerte**
   - Evitar `any`.
   - Reutilizar tipos de entidades y DTOs.
   - Si hace falta, crear tipos derivados bien nombrados.

5. **Separar responsabilidades**
   - UI presentacional separada de lógica de datos.
   - Hooks para fetching/estado remoto.
   - Servicios API para llamadas HTTP.
   - Backend con controladores, servicios y validaciones separados.

6. **No sobreingenierizar**
   - Hacer soluciones simples, legibles y fáciles de mantener.
   - Refactorizar solo cuando aporte valor real.

---

## Estructura conceptual del dominio

### Entidades principales

#### Business
Representa el negocio dueño de la cuenta.
Puede incluir:
- nombre
- dirección
- horarios generales
- configuración
- moneda
- políticas de cancelación

#### Professional
Persona que atiende turnos.
Puede tener:
- nombre
- color
- estado activo/inactivo
- horarios laborales
- servicios asignados

#### Service
Servicio que se ofrece.
Puede tener:
- nombre
- descripción
- duración en minutos
- precio
- estado activo/inactivo

#### Client
Cliente del negocio.
Puede tener:
- nombre completo
- teléfono
- email
- notas
- historial de turnos

#### Appointment
Turno agendado.
Debe contemplar:
- cliente
- profesional
- servicio
- fecha/hora de inicio
- fecha/hora de fin
- estado
- método de pago o seña si aplica
- observaciones

---

## Reglas de negocio importantes

### Agenda
- Un turno pertenece a un único profesional.
- Un turno corresponde a un único servicio principal.
- Un turno tiene cliente asociado.
- La agenda debe poder filtrarse por:
  - fecha
  - profesional
  - estado

### Solapamientos
- No permitir turnos superpuestos para el mismo profesional.
- Validar disponibilidad real antes de crear o reprogramar.

### Estados del turno
Usar estados claros y consistentes. Ejemplo:
- `RESERVED`
- `DEPOSIT_PAID`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

Si se agrega un nuevo estado:
- actualizar backend
- actualizar tipos frontend
- actualizar labels
- actualizar badges/UI
- actualizar filtros si corresponde

### Reprogramación
Cuando se edita un turno:
- validar si sigue existiendo disponibilidad
- recalcular inicio/fin si cambia servicio o profesional
- no asumir que el horario anterior sigue siendo válido

### Profesionales
- Un profesional puede ofrecer múltiples servicios.
- Un servicio puede ser ofrecido por múltiples profesionales.
- Solo mostrar profesionales activos en flujos operativos, salvo vistas administrativas.

### Servicios
- La duración del servicio impacta directamente en la disponibilidad.
- Si cambia la duración, revisar impactos en agenda y edición de turnos.

---

## Convenciones de frontend

### Componentes
- Mantener componentes chicos y reutilizables.
- Separar componentes “smart” de componentes “UI”.
- Si un componente crece demasiado, dividirlo.

### Hooks
Usar hooks para encapsular lógica de datos y estados derivados.

Ejemplos:
- `useClients`
- `useProfessionals`
- `useProfessionalServices`
- `useAgendaDaily`
- `useAvailability`

Reglas:
- los hooks no deben renderizar UI
- deben devolver datos ya listos para consumir
- usar `React Query` para server state

### React Query
- Toda data remota debe pasar por React Query salvo casos excepcionales.
- Usar query keys consistentes.
- Invalidar queries relevantes después de mutaciones.

Ejemplo:
- al crear turno, invalidar agenda diaria
- al editar turno, invalidar agenda diaria y detalle si existe
- al cambiar servicios/profesionales, invalidar listas relacionadas

### Formularios
- Priorizar UX clara.
- Deshabilitar campos dependientes si falta contexto.
- Orden lógico recomendado para nuevo turno:
  1. cliente
  2. profesional
  3. servicio
  4. fecha
  5. horario

### UI / diseño
- Estética sobria.
- Bordes suaves.
- Buen espacio en blanco.
- Colores semánticos y moderados.
- Evitar saturación visual.
- Mantener coherencia entre dashboard, agenda y modales.

### Tailwind
- Reutilizar patrones de clases frecuentes.
- Evitar strings enormes si pueden abstraerse.
- Mantener consistencia en paddings, gaps, radios y shadows.

---

## Convenciones de backend

### Arquitectura sugerida
Separar en capas:

- **routes**
- **controllers**
- **services**
- **repositories** si hace falta
- **validators / schemas**
- **utils**

### Controladores
- Deben ser finos.
- Reciben request, validan input básico y delegan al service.
- No meter lógica de negocio compleja en controladores.

### Services
- Contienen la lógica del dominio.
- Validan reglas de negocio.
- Orquestan acceso a Prisma.

### Prisma
- Evitar queries gigantes si perjudican legibilidad.
- Seleccionar/include solo lo necesario.
- Reutilizar helpers cuando haya lógica repetida.

### Validación
- Validar siempre:
  - IDs requeridos
  - formatos de fecha
  - rangos horarios
  - solapamientos
  - existencia de entidades relacionadas

### Manejo de errores
- Mensajes claros.
- Errores de negocio con respuesta comprensible.
- No exponer detalles internos innecesarios.

---

## Patrones de código a respetar

### Tipos
Preferir tipos explícitos.

Ejemplo:
- `AppointmentStatus`
- `DepositMethod`
- `AgendaAppointment`
- `ProfessionalService`

Si un map depende de un union type o enum, tiparlo correctamente.

### Nombres
Usar nombres descriptivos:
- `selectedProfessionalId`
- `selectedDateYMD`
- `effectiveProfessionalId`
- `appointmentsByHour`
- `availableSlots`

Evitar nombres vagos:
- `data`
- `item`
- `temp`
- `obj`

### Fechas y horas
- Internamente trabajar con formatos consistentes.
- Para fechas tipo agenda usar `yyyy-MM-dd`.
- Para horas usar `HH:mm`.
- Para mostrar al usuario, formatear con `date-fns`.

### No duplicar lógica
Si una lógica aparece en 2 o más lugares:
- mover a helper
- mover a hook
- mover a service

---

## Flujo esperado para crear un turno

1. Seleccionar cliente.
2. Seleccionar profesional.
3. Cargar servicios de ese profesional.
4. Seleccionar servicio.
5. Obtener disponibilidad según:
   - fecha
   - profesional
   - duración del servicio
6. Seleccionar horario.
7. Confirmar creación.
8. Invalidar agenda y refrescar UI.

---

## Flujo esperado para editar/reprogramar un turno

1. Cargar datos actuales del turno.
2. Permitir modificar:
   - cliente
   - profesional
   - servicio
   - fecha
   - horario
3. Reconsultar disponibilidad cuando cambie:
   - profesional
   - servicio
   - fecha
4. Validar conflictos antes de guardar.
5. Persistir cambios.
6. Refrescar agenda.

---

## Dashboard

El dashboard debe responder principalmente a la fecha seleccionada.

Métricas posibles:
- cantidad de turnos del día
- turnos completados
- ingresos del día
- desglose por método de pago
- profesionales con más actividad
- servicios más vendidos

Reglas:
- si cambia `selectedDate`, debe actualizarse la información dependiente
- evitar métricas irrelevantes o visualmente ruidosas
- priorizar legibilidad y decisión rápida

---

## Performance

- Evitar renders innecesarios.
- Memoizar derivados pesados si hace falta.
- No pedir datos que no se usan.
- No invalidar queries de más.
- En agenda, prestar atención a:
  - agrupados por hora
  - filtrados por profesional
  - cambios de fecha
  - modales con mucho contenido

---

## Qué hacer antes de tocar código importante

Antes de implementar cambios grandes:

1. Entender el flujo actual completo.
2. Revisar tipos involucrados.
3. Detectar queries/hooks afectados.
4. Detectar impacto visual y de negocio.
5. Hacer cambios mínimos pero sólidos.

---

## Qué evitar

- No usar `any` salvo emergencia muy justificada.
- No meter lógica de negocio en componentes visuales.
- No hardcodear textos/estados si ya existen constantes.
- No duplicar enums o labels en múltiples archivos sin necesidad.
- No cambiar nombres de props o tipos sin revisar todos los usos.
- No romper la navegación o comportamiento mobile.
- No asumir que una vista solo se usa en desktop.

---

## Expectativa al proponer cambios

Cuando hagas cambios:
- priorizá soluciones concretas y aplicables
- respetá el estilo ya existente del proyecto
- proponé refactors solo si simplifican
- si hay varias opciones, elegir la más mantenible
- si un cambio afecta UX, cuidar desktop y mobile

---

## Formato de respuestas esperado al colaborar en este repo

Cuando propongas código o cambios:

1. Explicá brevemente qué problema resolvés.
2. Mostrá solo el bloque relevante si no hace falta pasar todo.
3. Si el cambio impacta otros archivos, mencionarlo.
4. Si detectás una mejora estructural clara, sugerila.
5. Mantené respuestas prácticas y orientadas a implementación.

---

## Objetivo final del producto

Construir una app de turnos que se sienta:
- profesional
- rápida
- confiable
- simple de usar
- visualmente limpia
- fácil de escalar a múltiples negocios

La experiencia de uso debe transmitir orden, control y claridad.