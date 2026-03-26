# Subscription & Billing System — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

Sistema de suscripciones para Caleio. Los negocios tienen un trial de 14 días y luego pagan mensualmente vía Stripe. El precio varía según moneda (ARS o USD) y cantidad de profesionales activos.

---

## Pricing

| | Base (hasta 2 prof.) | Prof. extra |
|---|---|---|
| **Argentina (ARS)** | $16.000/mes | $7.000/mes c/u |
| **Internacional (USD)** | $18/mes | $7/mes c/u |

La moneda se define al registrarse el negocio (`currency: "ARS" | "USD"`) y no cambia.

---

## Estados de suscripción

```
TRIAL → ACTIVE         (pago exitoso)
TRIAL → CANCELED       (trial vencido sin pago)
ACTIVE → PAST_DUE      (pago fallido, webhook de Stripe)
ACTIVE → CANCELED      (cancelación desde portal de Stripe)
PAST_DUE → ACTIVE      (pago recuperado)
PAST_DUE → CANCELED    (Stripe da de baja tras reintentos)
```

---

## Modelo de datos

Campos a agregar en `model Business` (Prisma):

```prisma
stripeCustomerId      String?  @unique
stripeSubscriptionId  String?  @unique
trialEndsAt           DateTime?
currency              String   @default("ARS")  // "ARS" | "USD"
billingExempt         Boolean  @default(false)
```

Campos ya existentes que se usan:
- `subscriptionStatus: SubscriptionStatus` (TRIAL | ACTIVE | PAST_DUE | CANCELED)
- `plan: PlanType` (STARTER — único plan por ahora)

---

## Flujo de trial

1. Al crear un negocio: `trialEndsAt = now() + 14 días`, `subscriptionStatus = TRIAL`
2. **Día 13 y 14:** el frontend muestra un banner amarillo de advertencia (se calcula en cliente comparando `trialEndsAt` con la fecha actual — no requiere campo extra en DB)
3. **Día 15+:** el middleware detecta trial vencido → responde HTTP 402 → frontend muestra modal bloqueante

---

## Flujo de suscripción

1. Usuario hace clic en "Suscribirme" en el modal bloqueante
2. Frontend llama a `POST /api/billing/create-checkout`
3. Backend crea una sesión de Stripe Checkout con el precio correcto según `currency` y cantidad de profesionales activos, y devuelve la URL
4. Frontend redirige al usuario a la URL de Stripe
5. Stripe procesa el pago y redirige de vuelta a la app (`/settings?billing=success`)
6. Webhook de Stripe (`checkout.session.completed` / `invoice.paid`) actualiza `subscriptionStatus = ACTIVE` y guarda `stripeCustomerId` + `stripeSubscriptionId`

---

## Profesionales extra

- Al intentar **activar** un profesional que deja el total en 3 o más activos, aparece un modal de confirmación
- El modal muestra: cantidad actual, nueva cantidad, nuevo monto mensual calculado
- Si confirma: `POST /api/billing/update-quantity` → actualiza la suscripción en Stripe (Stripe proratea automáticamente)
- Si cancela: no se activa el profesional

El conteo de profesionales activos se calcula en tiempo real (no se guarda en DB).

---

## Exención de billing

Campo `billingExempt: Boolean @default(false)` en `Business`.

- Si `billingExempt = true`, el middleware y el `SubscriptionGate` dejan pasar al negocio sin importar `subscriptionStatus`
- Se activa manualmente desde la DB (futuro: panel admin)
- Útil para demos, vitrina, negocios amigos

---

## Backend

### Nuevos endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/billing/create-checkout` | Crea sesión de Stripe Checkout, devuelve URL |
| `POST` | `/api/billing/create-portal` | Crea sesión del portal de Stripe, devuelve URL |
| `POST` | `/api/billing/webhook` | Recibe y procesa eventos de Stripe |
| `POST` | `/api/billing/update-quantity` | Actualiza cantidad de profesionales en la suscripción |
| `GET` | `/api/billing/status` | Devuelve estado actual de la suscripción del negocio |

### Middleware `requireActiveSubscription`

Se aplica a todas las rutas autenticadas (excepto `/api/billing/*` y `/api/auth/*`).

Lógica:
```
si billingExempt → pasar
si subscriptionStatus === ACTIVE → pasar
si subscriptionStatus === TRIAL && trialEndsAt > now() → pasar
sino → HTTP 402 { error: "SUBSCRIPTION_REQUIRED" }
```

### Webhook handlers (eventos de Stripe)

- `checkout.session.completed` → `ACTIVE`, guardar IDs
- `invoice.paid` → `ACTIVE`
- `invoice.payment_failed` → `PAST_DUE`
- `customer.subscription.deleted` → `CANCELED`

### Job de cron

El job existente (`reminder.job.ts`) se extiende para:
- Detectar trials que vencen en exactamente 1 día (día 13→14) o en 0 días (día 14→15) y enviar email de aviso al dueño del negocio (opcional, fase 2)

Por ahora el banner de aviso lo calcula el frontend con `trialEndsAt`.

---

## Frontend

### `SubscriptionGate` (nuevo componente)

- Wrapper que envuelve toda la app autenticada (en el router, por encima de las páginas)
- Lee `business.subscriptionStatus`, `business.trialEndsAt`, `business.billingExempt`
- Si el acceso está bloqueado, renderiza un modal fullscreen no closeable
- El modal muestra:
  - Título: "Tu período de prueba ha vencido"
  - Plan y precio según `currency`
  - Lista de qué incluye (hasta 2 profesionales, agenda, clientes, notificaciones por email)
  - Botón primario: "Suscribirme" → llama a `create-checkout` y redirige
  - Link secundario: "Hablar con soporte" → WhatsApp o email del owner de Caleio

### Banner de trial (días 13 y 14)

- Franja amarilla/ámbar en la parte superior de la app (por encima del nav)
- Texto: "Tu período de prueba vence en X días. Suscribite para no perder el acceso."
- Botón: "Suscribirme" → mismo flujo que el modal
- Se oculta si `subscriptionStatus !== TRIAL` o si faltan más de 2 días

### Settings → Sección "Suscripción"

- Estado actual con badge de color
- Fecha de próximo cobro (si está activo)
- Plan y monto actual
- Botón "Administrar suscripción" → llama a `create-portal` y redirige al portal de Stripe

### Modal de confirmación de profesional extra

- Se dispara al intentar activar el N-ésimo profesional (N > 2)
- Muestra: "Tenés X profesionales activos. Agregar uno más cambia tu plan a $Y/mes."
- Botones: Confirmar / Cancelar

---

## Variables de entorno necesarias

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_ARS=price_...       # precio base ARS en Stripe
STRIPE_PRICE_ID_USD=price_...       # precio base USD en Stripe
STRIPE_PRICE_ID_EXTRA_ARS=price_... # profesional extra ARS
STRIPE_PRICE_ID_EXTRA_USD=price_... # profesional extra USD
```

---

## Fuera de scope (fase 2)

- Emails automáticos de aviso de trial (días 13/14)
- Panel admin para gestionar negocios y exenciones
- Descuentos o códigos promocionales
- Facturación electrónica
- Múltiples planes (solo STARTER por ahora)
