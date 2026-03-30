# Optional Professional Selection in Booking Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-service toggle that lets the business owner decide whether clients choose a professional when booking online; if disabled, the client skips that step and the backend auto-assigns a random available professional.

**Architecture:** New `allowClientChooseProfessional` boolean on `Service` (default `true`). When `false`, a new aggregated-availability endpoint merges slots across all professionals, and `createPublicAppointment` auto-assigns at creation time. The booking page's step flow is dynamically calculated based on the selected service.

**Tech Stack:** Node.js/Express/Prisma (backend), React/TypeScript/Vite/TailwindCSS (frontend), Zod validators, Resend (email)

---

## File Map

| File | Change |
|---|---|
| `backend/prisma/schema.prisma` | Add `allowClientChooseProfessional Boolean @default(true)` to `Service` |
| `backend/prisma/migrations/20260330000000_add_allow_client_choose_professional/migration.sql` | New migration |
| `backend/src/validators/index.ts` | Add field to `createServiceBody`; make `professionalId` optional in `publicCreateAppointmentBody` |
| `backend/src/services/public.service.ts` | New `getPublicAggregatedAvailability`; update `getPublicServices`; update `createPublicAppointment` |
| `backend/src/controllers/public.controller.ts` | New `getAggregatedAvailabilityHandler` |
| `backend/src/routes/public.routes.ts` | New route `GET /:slug/availability` |
| `backend/src/services/email.service.ts` | Add cancellation note to `sendAppointmentConfirmed` |
| `frontend/src/types/entities.ts` | Add `allowClientChooseProfessional` to `Service`, `ServiceWithProfessional`, `UpdateServicePayload`, `CreateServicePayload` |
| `frontend/src/services/services.api.ts` | Pass field in `updateService` and `createService` |
| `frontend/src/components/services/ServiceDetailModal.tsx` | Add toggle state + UI + wire to save |
| `frontend/src/components/services/NewServiceFormModal.tsx` | Add toggle state + UI + wire to save |
| `frontend/src/pages/BookingPage.tsx` | Dynamic step flow, new availability fetch, cancellation note in done screen |

---

## Task 1: Schema + Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260330000000_add_allow_client_choose_professional/migration.sql`

- [ ] **Step 1: Add field to schema**

In `backend/prisma/schema.prisma`, inside the `Service` model, add the new field after `bookableOnline`:

```prisma
model Service {
  id          String   @id @default(uuid())
  businessId  String
  name        String
  durationMin Int
  description String?
  basePrice       Decimal
  requiresDeposit  Boolean  @default(false)
  depositPercent   Int?
  bookableOnline   Boolean  @default(true)
  allowClientChooseProfessional Boolean @default(true)
  active           Boolean  @default(true)
  createdAt   DateTime @default(now())

  business     Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  appointments Appointment[]
  professionalServices ProfessionalService[]

  @@index([businessId])
}
```

- [ ] **Step 2: Create migration file**

Create `backend/prisma/migrations/20260330000000_add_allow_client_choose_professional/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "Service" ADD COLUMN "allowClientChooseProfessional" BOOLEAN NOT NULL DEFAULT true;
```

- [ ] **Step 3: Apply migration**

Run from `backend/`:
```bash
npx prisma migrate deploy
```
Expected: `1 migration applied successfully.`

If local dev uses SQLite, run instead:
```bash
npx prisma migrate dev --name add_allow_client_choose_professional
```

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```
Expected: `Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/20260330000000_add_allow_client_choose_professional/
git commit -m "feat: add allowClientChooseProfessional field to Service schema"
```

---

## Task 2: Backend Validators

**Files:**
- Modify: `backend/src/validators/index.ts`

- [ ] **Step 1: Add field to `createServiceBody`**

Find `createServiceBody` (currently around line 78) and add `allowClientChooseProfessional` after `bookableOnline`:

```typescript
export const createServiceBody = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  durationMin: z
    .number({ error: "durationMin debe ser un número" })
    .int()
    .min(1)
    .max(480, "La duración máxima es 480 minutos"),
  basePrice: z
    .number({ error: "basePrice debe ser un número" })
    .min(0)
    .max(1_000_000)
    .optional()
    .nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().optional(),
  requiresDeposit: z.boolean().optional(),
  depositPercent: z.number().int().min(1).max(100).optional().nullable(),
  bookableOnline: z.boolean().optional(),
  allowClientChooseProfessional: z.boolean().optional(),
});
```

(`updateServiceBody` is derived via `.partial()` so it picks up the change automatically.)

- [ ] **Step 2: Make `professionalId` optional in `publicCreateAppointmentBody`**

Find `publicCreateAppointmentBody` (around line 312) and change `professionalId` from `uuid` to `uuid.optional()`:

```typescript
export const publicCreateAppointmentBody = z.object({
  serviceId: uuid,
  professionalId: uuid.optional(),
  startAt: isoDatetime,
  clientFullName: z.string().trim().min(1, "El nombre es requerido").max(100),
  clientPhone: z
    .string()
    .trim()
    .min(1, "El teléfono es requerido")
    .max(30)
    .regex(/^[\d\s+\-().]+$/, "Teléfono inválido"),
  clientEmail: z.preprocess(v => (v === "" ? undefined : v), z.string().trim().email("Email inválido").max(254).optional().nullable()),
});
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/validators/index.ts
git commit -m "feat: add allowClientChooseProfessional to service validators; make professionalId optional in public booking"
```

---

## Task 3: Backend Public Service Logic

**Files:**
- Modify: `backend/src/services/public.service.ts`

- [ ] **Step 1: Add `allowClientChooseProfessional` to `getPublicServices` select**

Find `getPublicServices` and update the `select` object to include the new field:

```typescript
export async function getPublicServices(slug: string) {
  const business = await getBusinessBySlug(slug);
  return prisma.service.findMany({
    where: { businessId: business.id, active: true, bookableOnline: true },
    select: {
      id: true,
      name: true,
      durationMin: true,
      basePrice: true,
      requiresDeposit: true,
      depositPercent: true,
      allowClientChooseProfessional: true,
    },
    orderBy: { name: "asc" },
  });
}
```

- [ ] **Step 2: Add `getPublicAggregatedAvailability` function**

Add this new function after `getPublicAvailability`:

```typescript
export async function getPublicAggregatedAvailability(
  slug: string,
  date: string,
  serviceId: string
) {
  const business = await getBusinessBySlug(slug);

  const links = await prisma.professionalService.findMany({
    where: {
      serviceId,
      professional: { businessId: business.id, active: true },
    },
    select: { professionalId: true },
  });

  if (links.length === 0) return { slots: [] };

  const results = await Promise.allSettled(
    links.map(({ professionalId }) =>
      professionalService.getAvailability({
        businessId: business.id,
        professionalId,
        date,
        serviceId,
      })
    )
  );

  const slotMap = new Map<string, { startAt: string; endAt: string; label: string }>();
  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const slot of result.value.slots) {
        if (!slotMap.has(slot.startAt)) {
          slotMap.set(slot.startAt, slot);
        }
      }
    }
  }

  const now = new Date();
  const slots = Array.from(slotMap.values())
    .filter((s) => new Date(s.startAt) > now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  return { slots };
}
```

- [ ] **Step 3: Update `createPublicAppointment` to handle optional `professionalId`**

Replace the function signature and add auto-assign logic. The full updated function:

```typescript
export async function createPublicAppointment(
  slug: string,
  data: {
    serviceId: string;
    professionalId?: string;
    startAt: string;
    clientFullName: string;
    clientPhone: string;
    clientEmail?: string;
  }
) {
  const business = await getBusinessBySlug(slug);
  const { serviceId, startAt, clientFullName, clientPhone, clientEmail } = data;

  const startDate = new Date(startAt);
  if (startDate <= new Date()) {
    const err = new Error("No se pueden agendar turnos en el pasado") as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id },
    select: { id: true, name: true, basePrice: true, requiresDeposit: true, depositPercent: true, durationMin: true },
  });

  if (!service) {
    const err = new Error("Servicio no encontrado") as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  // ── Resolve professionalId (auto-assign if not provided) ──────────────────
  let professionalId = data.professionalId;

  if (!professionalId) {
    const endAt = new Date(startDate.getTime() + service.durationMin * 60_000);

    const links = await prisma.professionalService.findMany({
      where: {
        serviceId,
        professional: { businessId: business.id, active: true },
      },
      select: { professionalId: true },
    });

    const allProfessionalIds = links.map((l) => l.professionalId);

    if (allProfessionalIds.length === 0) {
      const err = new Error("No hay profesionales disponibles para este servicio") as Error & { status?: number };
      err.status = 409;
      throw err;
    }

    const pendingPaymentCutoff = new Date(Date.now() - 30 * 60 * 1000);

    const [busyFromAppointments, busyFromUnavailabilities, busyFromPending] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          professionalId: { in: allProfessionalIds },
          status: { notIn: ["CANCELED"] },
          startAt: { lt: endAt },
          endAt: { gt: startDate },
        },
        select: { professionalId: true },
      }),
      prisma.professionalUnavailability.findMany({
        where: {
          professionalId: { in: allProfessionalIds },
          startAt: { lt: endAt },
          endAt: { gt: startDate },
        },
        select: { professionalId: true },
      }),
      prisma.pendingBooking.findMany({
        where: {
          professionalId: { in: allProfessionalIds },
          createdAt: { gte: pendingPaymentCutoff },
          startAt: { lt: endAt },
          // endAt not on PendingBooking — approximate with service duration
        },
        select: { professionalId: true },
      }),
    ]);

    const busyIds = new Set([
      ...busyFromAppointments.map((a) => a.professionalId),
      ...busyFromUnavailabilities.map((u) => u.professionalId),
      ...busyFromPending.map((p) => p.professionalId),
    ]);

    const availableIds = allProfessionalIds.filter((id) => !busyIds.has(id));

    if (availableIds.length === 0) {
      const err = new Error("No hay profesionales disponibles en ese horario") as Error & { status?: number };
      err.status = 409;
      throw err;
    }

    professionalId = availableIds[Math.floor(Math.random() * availableIds.length)];
  }

  // ── Client upsert ─────────────────────────────────────────────────────────
  let client = await prisma.client.findFirst({
    where: { businessId: business.id, phone: clientPhone },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        businessId: business.id,
        fullName: clientFullName,
        phone: clientPhone,
        email: clientEmail ?? null,
      },
    });
  } else {
    client = await prisma.client.update({
      where: { id: client.id },
      data: {
        fullName: clientFullName,
        email: clientEmail ?? client.email,
      },
    });
  }

  const needsDeposit = !!(business.mpAccessToken && service.requiresDeposit && service.depositPercent);

  if (needsDeposit) {
    const depositAmount = Math.round(Number(service.basePrice) * service.depositPercent! / 100);

    const availability = await professionalService.getAvailability({
      businessId: business.id,
      professionalId,
      date: startAt.slice(0, 10),
      serviceId,
    });
    const slotAvailable = availability.slots.some((s) => s.startAt === startAt || s.startAt.startsWith(startAt));
    if (!slotAvailable) {
      const err = new Error("El horario seleccionado ya no está disponible") as Error & { status?: number };
      err.status = 409;
      throw err;
    }

    const pending = await prisma.pendingBooking.create({
      data: {
        businessId: business.id,
        professionalId,
        clientId: client.id,
        serviceId,
        startAt: new Date(startAt),
        depositAmount,
      },
    });

    const { checkoutUrl } = await createMPPreference({
      accessToken: business.mpAccessToken!,
      appointmentId: pending.id,
      serviceName: service.name,
      depositAmount,
      slug,
    });

    return { pendingBookingId: pending.id, checkoutUrl, depositAmount };
  }

  const { appointment } = await appointmentService.create({
    businessId: business.id,
    professionalId,
    clientId: client.id,
    serviceId,
    startAt,
  });

  const assignedProfessional = await prisma.professional
    .findUnique({ where: { id: professionalId }, select: { id: true, name: true, color: true } });

  const professionalName = assignedProfessional?.name ?? "";
  const dateStr = formatWaDate(new Date(startAt), business.timezone);
  const timeStr = formatWaTime(new Date(startAt), business.timezone);

  // WA al cliente
  if (business.waAccessToken && business.waPhoneNumberId && client.phone) {
    sendTemplate({
      accessToken: business.waAccessToken,
      phoneNumberId: business.waPhoneNumberId,
      to: client.phone,
      templateName: "turno_confirmado",
      variables: [client.fullName, service.name, professionalName, dateStr, timeStr, business.name],
    }).catch(() => {});
  }

  // WA + email al dueño
  prisma.user
    .findFirst({ where: { businessId: business.id, role: "OWNER" }, select: { phone: true, email: true } })
    .then((owner) => {
      if (!owner) return;
      if (owner.phone && business.waAccessToken && business.waPhoneNumberId) {
        sendTemplate({
          accessToken: business.waAccessToken,
          phoneNumberId: business.waPhoneNumberId,
          to: owner.phone,
          templateName: "nuevo_turno_negocio",
          variables: [client!.fullName, service.name, professionalName, dateStr, timeStr],
        });
      }
      if (owner.email && business.emailNotificationsEnabled) {
        sendNewAppointmentOwner(owner.email, {
          clientName: client!.fullName,
          professionalName,
          serviceName: service.name,
          date: dateStr,
          time: timeStr,
          businessName: business.name,
        });
      }
    })
    .catch(() => {});

  // Email al cliente
  if (business.emailNotificationsEnabled && client.email) {
    sendAppointmentConfirmed(client.email, {
      clientName: client.fullName,
      professionalName,
      serviceName: service.name,
      date: dateStr,
      time: timeStr,
      businessName: business.name,
    });
  }

  return { appointment, assignedProfessional };
}
```

- [ ] **Step 4: Export `getPublicAggregatedAvailability`**

Ensure the function is exported (it is, since we wrote `export async function`).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/public.service.ts
git commit -m "feat: add aggregated availability endpoint and auto-assign professional in public booking"
```

---

## Task 4: Backend Controller + Route

**Files:**
- Modify: `backend/src/controllers/public.controller.ts`
- Modify: `backend/src/routes/public.routes.ts`

- [ ] **Step 1: Add `getAggregatedAvailabilityHandler` to controller**

In `public.controller.ts`, add this import at the top alongside the existing imports:

```typescript
import {
  getPublicBusinessInfo,
  getPublicServices,
  getPublicProfessionals,
  getPublicAvailability,
  getPublicAggregatedAvailability,
  createPublicAppointment,
  confirmPublicPayment,
} from "../services/public.service";
```

Then add the handler function after `getAvailabilityHandler`:

```typescript
export async function getAggregatedAvailabilityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params["slug"] as string;
    const { date, serviceId } = req.query as { date?: string; serviceId?: string };
    if (!date || !serviceId) {
      res.status(400).json({ error: "date and serviceId are required" });
      return;
    }
    const data = await getPublicAggregatedAvailability(slug, date, serviceId);
    res.json(data);
  } catch (err) {
    handleError(err, res);
  }
}
```

Also update `createAppointmentHandler` to remove the manual `professionalId` required check (Zod now handles validation), and remove the manual check for `professionalId`:

```typescript
export async function createAppointmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { serviceId, professionalId, startAt, clientFullName, clientPhone, clientEmail } =
      req.body;

    if (!serviceId || !startAt || !clientFullName || !clientPhone) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const result = await createPublicAppointment(req.params["slug"] as string, {
      serviceId,
      professionalId,
      startAt,
      clientFullName,
      clientPhone,
      clientEmail,
    });

    res.status(201).json(result);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 2: Add route to `public.routes.ts`**

Add the import for `getAggregatedAvailabilityHandler` and the new route:

```typescript
import { Router } from "express";
import {
  getBusinessInfoHandler,
  getServicesHandler,
  getProfessionalsHandler,
  getAvailabilityHandler,
  getAggregatedAvailabilityHandler,
  createAppointmentHandler,
  confirmPaymentHandler,
} from "../controllers/public.controller";
import { validate } from "../middleware/validate";
import {
  slugParams,
  publicAvailabilityParams,
  publicAvailabilityQuery,
  publicCreateAppointmentBody,
  confirmPaymentBody,
} from "../validators";

const router = Router();

router.get("/:slug/info", validate(slugParams, "params"), getBusinessInfoHandler);
router.get("/:slug/services", validate(slugParams, "params"), getServicesHandler);
router.get("/:slug/professionals", validate(slugParams, "params"), getProfessionalsHandler);
router.get(
  "/:slug/professionals/:professionalId/availability",
  validate(publicAvailabilityParams, "params"),
  validate(publicAvailabilityQuery, "query"),
  getAvailabilityHandler
);
router.get("/:slug/availability", validate(slugParams, "params"), getAggregatedAvailabilityHandler);
router.post("/:slug/appointments", validate(slugParams, "params"), validate(publicCreateAppointmentBody), createAppointmentHandler);
router.post(
  "/:slug/appointments/:appointmentId/confirm-payment",
  validate(confirmPaymentBody),
  confirmPaymentHandler
);

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/public.controller.ts backend/src/routes/public.routes.ts
git commit -m "feat: add GET /booking/:slug/availability aggregated endpoint"
```

---

## Task 5: Email — Cancellation Note

**Files:**
- Modify: `backend/src/services/email.service.ts`

- [ ] **Step 1: Add cancellation note to `sendAppointmentConfirmed`**

Find `sendAppointmentConfirmed` and update the email body to include the note after `appointmentDetailsTable`:

```typescript
export async function sendAppointmentConfirmed(to: string, data: AppointmentEmailData): Promise<void> {
  try {
    await sendEmail(
      to,
      `Tu turno está confirmado — ${data.businessName}`,
      appointmentEmailWrapper(`
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Turno confirmado</h2>
        <p style="color: #475569; margin-bottom: 4px;">Hola ${data.clientName},</p>
        <p style="color: #475569;">Tu turno ha sido confirmado.</p>
        ${appointmentDetailsTable(data)}
        <p style="color: #64748b; font-size: 13px; margin-top: 16px;">
          Para cancelar o modificar tu turno, comunicate directamente con el negocio.
        </p>
      `)
    );
  } catch (err) {
    console.error("[email] sendAppointmentConfirmed error:", err);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/email.service.ts
git commit -m "feat: add cancellation note to appointment confirmation email"
```

---

## Task 6: Frontend Types + Services API

**Files:**
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/services/services.api.ts`

- [ ] **Step 1: Add field to `Service` type**

In `entities.ts`, update `Service`:

```typescript
export type Service = {
  id: string;
  businessId: string;
  name: string;
  durationMin: number;
  basePrice: string;
  active: boolean;
  createdAt: string;
  description?: string;
  requiresDeposit: boolean;
  depositPercent: number | null;
  bookableOnline: boolean;
  allowClientChooseProfessional: boolean;
};
```

- [ ] **Step 2: Add field to `ServiceWithProfessional`**

```typescript
export type ServiceWithProfessional = {
  id: string;
  name: string;
  durationMin: number;
  basePrice: number;
  active: boolean;
  description?: string;
  requiresDeposit: boolean;
  depositPercent: number | null;
  bookableOnline: boolean;
  allowClientChooseProfessional: boolean;
  professionalServices: {
    professional: {
      id: string;
      name: string;
      active: boolean;
      color?: string;
    };
  }[];
};
```

- [ ] **Step 3: Add field to `UpdateServicePayload` and `CreateServicePayload`**

```typescript
export type UpdateServicePayload = {
  serviceId: string;
  name?: string;
  description?: string;
  durationMin?: number;
  basePrice?: number;
  active?: boolean;
  requiresDeposit?: boolean;
  depositPercent?: number | null;
  bookableOnline?: boolean;
  allowClientChooseProfessional?: boolean;
};

export type CreateServicePayload = {
  name: string;
  description?: string;
  durationMin: number;
  basePrice: number;
  active?: boolean;
  requiresDeposit?: boolean;
  depositPercent?: number | null;
  bookableOnline?: boolean;
  allowClientChooseProfessional?: boolean;
};
```

- [ ] **Step 4: Pass field in `services.api.ts`**

Update `updateService`:

```typescript
export async function updateService(payload: UpdateServicePayload) {
  const { serviceId } = payload;

  return apiFetch<{ service: ServiceWithProfessional }>(
    `/services/${serviceId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.durationMin !== undefined && { durationMin: payload.durationMin }),
        ...(payload.basePrice !== undefined && { basePrice: payload.basePrice }),
        ...(payload.active !== undefined && { active: payload.active }),
        ...(payload.requiresDeposit !== undefined && { requiresDeposit: payload.requiresDeposit }),
        ...(payload.depositPercent !== undefined && { depositPercent: payload.depositPercent }),
        ...(payload.bookableOnline !== undefined && { bookableOnline: payload.bookableOnline }),
        ...(payload.allowClientChooseProfessional !== undefined && { allowClientChooseProfessional: payload.allowClientChooseProfessional }),
      })
    }
  );
}
```

Update `createService`:

```typescript
export async function createService(payload: CreateServicePayload) {
  return apiFetch<{ service: ServiceWithProfessional }>(
    `/services`,
    {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        durationMin: payload.durationMin,
        basePrice: payload.basePrice,
        active: payload.active ?? true,
        requiresDeposit: payload.requiresDeposit ?? false,
        depositPercent: payload.depositPercent ?? null,
        bookableOnline: payload.bookableOnline ?? true,
        allowClientChooseProfessional: payload.allowClientChooseProfessional ?? true,
      }),
    }
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/entities.ts frontend/src/services/services.api.ts
git commit -m "feat: add allowClientChooseProfessional to frontend service types and API"
```

---

## Task 7: Service Form Modals

**Files:**
- Modify: `frontend/src/components/services/ServiceDetailModal.tsx`
- Modify: `frontend/src/components/services/NewServiceFormModal.tsx`

### ServiceDetailModal

- [ ] **Step 1: Add state variable**

After the `bookableOnline` state (around line 44), add:

```typescript
const [allowClientChooseProfessional, setAllowClientChooseProfessional] = useState(true);
```

- [ ] **Step 2: Initialize from service in `useEffect`**

Inside the `useEffect` (around line 50–64), after `setBookableOnline(service.bookableOnline ?? true);`, add:

```typescript
setAllowClientChooseProfessional(service.allowClientChooseProfessional ?? true);
```

- [ ] **Step 3: Pass to `mutateAsync`**

Inside `handleSave`, in the `mutateAsync` call (around line 98–108), add the field:

```typescript
await updateServiceMutation.mutateAsync({
  serviceId: service.id,
  name: trimmedName,
  description: description.trim(),
  durationMin: Number(durationMin),
  basePrice: Number(basePrice),
  active,
  requiresDeposit,
  depositPercent: requiresDeposit ? Number(depositPercent) : null,
  bookableOnline,
  allowClientChooseProfessional,
});
```

- [ ] **Step 4: Add UI toggle**

Find where `bookableOnline` toggle is rendered and add the new toggle right after it, in the same visual group. Search for the `bookableOnline` toggle in the JSX and add this block after it:

```tsx
{/* Allow client choose professional */}
<div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
  <div>
    <p className="text-sm font-medium text-slate-700">El cliente puede elegir profesional</p>
    <p className="text-xs text-slate-400 mt-0.5">Si está desactivado, se asigna uno disponible al azar</p>
  </div>
  <button
    type="button"
    onClick={() => setAllowClientChooseProfessional((prev) => !prev)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
      allowClientChooseProfessional ? "bg-teal-600" : "bg-slate-200"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        allowClientChooseProfessional ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
</div>
```

### NewServiceFormModal

- [ ] **Step 5: Add state variable**

After `const [bookableOnline, setBookableOnline] = useState(true);` (around line 26), add:

```typescript
const [allowClientChooseProfessional, setAllowClientChooseProfessional] = useState(true);
```

- [ ] **Step 6: Reset in `useEffect`**

After `setBookableOnline(true);` in the `useEffect`, add:

```typescript
setAllowClientChooseProfessional(true);
```

- [ ] **Step 7: Pass to `mutateAsync`**

In the `createServiceMutation.mutateAsync` call (around line 77–86), add:

```typescript
await createServiceMutation.mutateAsync({
  name: trimmedName,
  description: description.trim(),
  durationMin: Number(durationMin),
  basePrice: Number(basePrice),
  active,
  requiresDeposit,
  depositPercent: requiresDeposit ? Number(depositPercent) : null,
  bookableOnline,
  allowClientChooseProfessional,
});
```

- [ ] **Step 8: Add UI toggle**

Add the same toggle JSX in the same section as `bookableOnline` toggle:

```tsx
{/* Allow client choose professional */}
<div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
  <div>
    <p className="text-sm font-medium text-slate-700">El cliente puede elegir profesional</p>
    <p className="text-xs text-slate-400 mt-0.5">Si está desactivado, se asigna uno disponible al azar</p>
  </div>
  <button
    type="button"
    onClick={() => setAllowClientChooseProfessional((prev) => !prev)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
      allowClientChooseProfessional ? "bg-teal-600" : "bg-slate-200"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        allowClientChooseProfessional ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
</div>
```

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/services/ServiceDetailModal.tsx frontend/src/components/services/NewServiceFormModal.tsx
git commit -m "feat: add allowClientChooseProfessional toggle to service modals"
```

---

## Task 8: BookingPage — Dynamic Flow

**Files:**
- Modify: `frontend/src/pages/BookingPage.tsx`

This task rewrites several parts of `BookingPage.tsx`. Read the existing file before making changes.

- [ ] **Step 1: Update the `Service` type**

At the top of the file (around line 14), update the `Service` type:

```typescript
type Service = {
  id: string;
  name: string;
  durationMin: number;
  basePrice: number;
  requiresDeposit: boolean;
  depositPercent: number | null;
  allowClientChooseProfessional: boolean;
};
```

- [ ] **Step 2: Update `StepBar` to accept `skipProfessional` prop**

Replace the `StepBar` component (lines 50–86) with a version that accepts `skipProfessional`:

```typescript
function StepBar({ current, skipProfessional }: { current: Step; skipProfessional: boolean }) {
  const visible: Step[] = skipProfessional
    ? ["service", "datetime", "client", "confirm"]
    : ["service", "professional", "datetime", "client", "confirm"];
  const currentIdx = stepIndex(current);

  return (
    <div className="flex items-center gap-1 mb-8">
      {visible.map((step, i) => {
        const idx = stepIndex(step);
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? "bg-teal-600 text-white"
                    : active
                    ? "bg-teal-600 text-white ring-4 ring-teal-100"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-[10px] hidden sm:block ${active ? "text-teal-700 font-medium" : "text-slate-400"}`}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < visible.length - 1 && (
              <div className={`flex-1 h-px mb-3 ${idx < currentIdx ? "bg-teal-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Add `skipProfessional` derived value in the main component**

After the state declarations in `BookingPage` (around line 160), add:

```typescript
const skipProfessional = selectedService?.allowClientChooseProfessional === false;
```

- [ ] **Step 4: Update `goBack` to be dynamic**

Replace the `goBack` function (lines 225–236) with a version that respects `skipProfessional`:

```typescript
function goBack() {
  const prev: Record<Step, Step> = skipProfessional
    ? {
        service: "service",
        professional: "service",  // never reached when skipping
        datetime: "service",
        client: "datetime",
        confirm: "client",
        redirecting: "redirecting",
        done: "done",
      }
    : {
        service: "service",
        professional: "service",
        datetime: "professional",
        client: "datetime",
        confirm: "client",
        redirecting: "redirecting",
        done: "done",
      };
  setStep(prev[step]);
}
```

- [ ] **Step 5: Update `nextStep` map to be dynamic**

Replace the `nextStep` record (lines 355–363) with:

```typescript
const nextStep: Record<Step, Step> = skipProfessional
  ? {
      service: "datetime",
      professional: "datetime",  // never reached when skipping
      datetime: "client",
      client: "confirm",
      confirm: "confirm",
      redirecting: "redirecting",
      done: "done",
    }
  : {
      service: "professional",
      professional: "datetime",
      datetime: "client",
      client: "confirm",
      confirm: "confirm",
      redirecting: "redirecting",
      done: "done",
    };
```

- [ ] **Step 6: Add aggregated availability fetch effect**

After the existing slots effect (around line 223), add a new effect for when `skipProfessional` is true:

```typescript
// Load slots for aggregated availability (no specific professional)
useEffect(() => {
  if (!slug || !selectedService || !skipProfessional || step !== "datetime") return;
  setSlots([]);
  setSelectedSlot(null);
  setLoadingSlots(true);
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  fetch(`/booking/${slug}/availability?serviceId=${selectedService.id}&date=${dateStr}`)
    .then((r) => r.json())
    .then((data) => {
      const now = new Date();
      const future = (data.slots ?? []).filter(
        (s: Slot) => new Date(s.startAt) > now
      );
      setSlots(future);
    })
    .finally(() => setLoadingSlots(false));
}, [slug, selectedService, selectedDate, step, skipProfessional]);
```

Also update the existing slots effect to only run when `selectedProfessional` exists (add `selectedProfessional` guard):

```typescript
// Load slots when professional or date changes (during datetime step) — only when professional chosen
useEffect(() => {
  if (!slug || !selectedProfessional || !selectedService || step !== "datetime" || skipProfessional) return;
  setSlots([]);
  setSelectedSlot(null);
  setLoadingSlots(true);
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  fetch(
    `/booking/${slug}/professionals/${selectedProfessional.id}/availability?date=${dateStr}&serviceId=${selectedService.id}`
  )
    .then((r) => r.json())
    .then((data) => {
      const now = new Date();
      const future = (data.slots ?? []).filter(
        (s: Slot) => new Date(s.startAt) > now
      );
      setSlots(future);
    })
    .finally(() => setLoadingSlots(false));
}, [slug, selectedProfessional, selectedService, selectedDate, step, skipProfessional]);
```

- [ ] **Step 7: Update `handleConfirm` to handle optional professional**

Replace `handleConfirm` (lines 238–273):

```typescript
async function handleConfirm() {
  if (!slug || !selectedService || !selectedSlot) return;
  if (!skipProfessional && !selectedProfessional) return;
  setSubmitting(true);
  setSubmitError(null);
  try {
    const res = await fetch(`/booking/${slug}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
        ...(selectedProfessional && { professionalId: selectedProfessional.id }),
        startAt: selectedSlot.startAt,
        clientFullName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "No se pudo confirmar el turno");
    }
    const result = await res.json();
    // If professional was auto-assigned, store it for the done screen
    if (result.assignedProfessional) {
      setSelectedProfessional(result.assignedProfessional);
    }
    if (result.checkoutUrl) {
      setStep("redirecting");
      setTimeout(() => {
        window.location.href = result.checkoutUrl;
      }, 300);
    } else {
      setStep("done");
    }
  } catch (e) {
    setSubmitError((e as Error).message);
  } finally {
    setSubmitting(false);
  }
}
```

- [ ] **Step 8: Update `canGoNext` for the professional step**

Update the `canGoNext` record to always allow "professional" step when it's being skipped:

```typescript
const canGoNext: Record<Step, boolean> = {
  service: !!selectedService,
  professional: skipProfessional ? true : !!selectedProfessional,
  datetime: !!selectedSlot,
  client: clientName.trim().length >= 2 && clientPhone.replace(/\D/g, "").length >= 6,
  confirm: true,
  redirecting: false,
  done: false,
};
```

- [ ] **Step 9: Pass `skipProfessional` to `StepBar`**

Find `<StepBar current={step} />` (around line 384) and update to:

```tsx
<StepBar current={step} skipProfessional={skipProfessional} />
```

- [ ] **Step 10: Add cancellation note to "done" screen**

Find the "done" screen (around line 315–338) and add the note after the summary card:

```tsx
if (step === "done") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-teal-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-1">¡Turno confirmado!</h2>
        <p className="text-slate-500 text-sm mb-6">
          Tu turno en <span className="font-medium text-slate-700">{business?.name}</span> fue agendado.
        </p>
        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm">
          <Row label="Servicio" value={selectedService?.name ?? ""} />
          <Row label="Profesional" value={selectedProfessional?.name ?? ""} />
          <Row
            label="Fecha"
            value={format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          />
          <Row label="Hora" value={selectedSlot?.label ?? ""} />
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Para cancelar o modificar tu turno, comunicate directamente con el negocio.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Commit**

```bash
git add frontend/src/pages/BookingPage.tsx
git commit -m "feat: dynamic booking flow - skip professional step when service has allowClientChooseProfessional=false"
```

---

## Manual Testing Checklist

After all tasks are done, verify:

1. **Existing services** (before toggle): all have `allowClientChooseProfessional = true` by default → booking flow unchanged (5 steps)
2. **Service detail modal**: toggle appears, saves correctly, re-opens with correct state
3. **New service modal**: toggle appears, defaults to `true`
4. **Booking with toggle ON** (default): service → professional → datetime → client → confirm → done (5 steps, unchanged)
5. **Booking with toggle OFF**: service → datetime → client → confirm → done (4 steps, no professional shown)
6. **Aggregated availability**: available slots include times from all professionals (verify by having 2 professionals with different schedules)
7. **Auto-assign**: created appointment is assigned to a valid professional; done screen shows their name
8. **No professionals available**: booking attempt returns error "No hay profesionales disponibles en ese horario"
9. **Email**: confirmation email includes cancellation note
10. **Done screen**: shows "Para cancelar o modificar tu turno..." note

---

## Deploy Notes

- Run `npx prisma migrate deploy` on Railway after pushing
- No environment variable changes needed
