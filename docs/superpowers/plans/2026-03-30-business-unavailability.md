# Business Unavailability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow business owners to mark specific dates (feriados, días cerrados) as unavailable, blocking all online bookings for those days and reflecting that in availability queries.

**Architecture:** New `BusinessUnavailability` Prisma model storing closed dates as `date` strings (`yyyy-MM-dd`). The availability service checks for a matching closure before computing slots and returns `[]` early. Admin UI lives in `BusinessSettingsPage` as a self-contained section component.

**Tech Stack:** Prisma ORM, Express, TypeScript, React, React Query, TailwindCSS v4, date-fns, Lucide React.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/prisma/schema.prisma` | Modify | Add `BusinessUnavailability` model and relation to `Business` |
| `backend/prisma/migrations/20260330000001_add_business_unavailability/migration.sql` | Create | SQL migration for new table |
| `backend/src/validators/index.ts` | Modify | Add `businessUnavailabilityIdParam`, `createBusinessUnavailabilityBody` |
| `backend/src/services/business.service.ts` | Modify | Add `getUnavailabilities`, `createUnavailability`, `deleteUnavailability` methods |
| `backend/src/services/professionals.service.ts` | Modify | Check `BusinessUnavailability` in `getAvailability()` → return `slots: []` early |
| `backend/src/controllers/business.controller.ts` | Modify | Add 3 handlers: list, create, delete business unavailabilities |
| `backend/src/routes/business.routes.ts` | Modify | Wire 3 new routes under `/business/unavailabilities` |
| `frontend/src/services/business.api.ts` | Create | `getBusinessUnavailabilities`, `createBusinessUnavailability`, `deleteBusinessUnavailability` |
| `frontend/src/hooks/useBusinessUnavailabilities.ts` | Create | `useBusinessUnavailabilities`, `useCreateBusinessUnavailability`, `useDeleteBusinessUnavailability` |
| `frontend/src/components/settings/ClosedDaysSection.tsx` | Create | Self-contained UI: list + form to manage closed dates |
| `frontend/src/pages/BusinessSettingsPage.tsx` | Modify | Import and render `<ClosedDaysSection />` |

---

## Task 1: Prisma Model + Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260330000001_add_business_unavailability/migration.sql`

- [ ] **Step 1: Add model to schema**

In `backend/prisma/schema.prisma`, add after the `ProfessionalUnavailability` model (around line 186):

```prisma
model BusinessUnavailability {
  id         String   @id @default(uuid())
  businessId String
  date       String   // yyyy-MM-dd
  reason     String?
  createdAt  DateTime @default(now())

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([businessId, date])
  @@index([businessId])
}
```

Also add the relation on the `Business` model (find `model Business` and add inside it):

```prisma
  businessUnavailabilities BusinessUnavailability[]
```

- [ ] **Step 2: Create migration file**

Create `backend/prisma/migrations/20260330000001_add_business_unavailability/migration.sql`:

```sql
CREATE TABLE "BusinessUnavailability" (
  "id"         TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "date"       TEXT NOT NULL,
  "reason"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BusinessUnavailability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessUnavailability_businessId_date_key"
  ON "BusinessUnavailability"("businessId", "date");

CREATE INDEX "BusinessUnavailability_businessId_idx"
  ON "BusinessUnavailability"("businessId");

ALTER TABLE "BusinessUnavailability"
  ADD CONSTRAINT "BusinessUnavailability_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Apply migration and regenerate client**

Run from `backend/`:
```bash
npx prisma migrate dev --name add_business_unavailability
```

Expected: migration applied, Prisma client regenerated with `BusinessUnavailability` model.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat: add BusinessUnavailability prisma model"
```

---

## Task 2: Backend — Validators, Service, Controller, Routes

**Files:**
- Modify: `backend/src/validators/index.ts`
- Modify: `backend/src/services/business.service.ts`
- Modify: `backend/src/controllers/business.controller.ts`
- Modify: `backend/src/routes/business.routes.ts`

- [ ] **Step 1: Add validators**

In `backend/src/validators/index.ts`, add at the end of the file:

```typescript
export const businessUnavailabilityIdParam = z.object({
  unavailabilityId: uuid,
});

export const createBusinessUnavailabilityBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-MM-dd"),
  reason: z.string().trim().max(200).optional().nullable(),
});
```

- [ ] **Step 2: Add service methods**

In `backend/src/services/business.service.ts`, add these methods to the existing `BusinessService` class (or as standalone exports if the file uses function exports — match the existing pattern):

```typescript
import prisma from "../lib/prisma"; // already imported

export async function getBusinessUnavailabilities(businessId: string) {
  return prisma.businessUnavailability.findMany({
    where: { businessId },
    orderBy: { date: "asc" },
  });
}

export async function createBusinessUnavailability(
  businessId: string,
  data: { date: string; reason?: string | null }
) {
  const existing = await prisma.businessUnavailability.findUnique({
    where: { businessId_date: { businessId, date: data.date } },
  });
  if (existing) {
    const err = new Error("Ya existe un cierre para esa fecha") as Error & { status?: number };
    err.status = 409;
    throw err;
  }
  return prisma.businessUnavailability.create({
    data: { businessId, date: data.date, reason: data.reason ?? null },
  });
}

export async function deleteBusinessUnavailability(businessId: string, id: string) {
  const record = await prisma.businessUnavailability.findFirst({
    where: { id, businessId },
  });
  if (!record) {
    const err = new Error("Cierre no encontrado") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  await prisma.businessUnavailability.delete({ where: { id } });
}
```

- [ ] **Step 3: Add controller handlers**

In `backend/src/controllers/business.controller.ts`, add at the end:

```typescript
import {
  getBusinessUnavailabilities,
  createBusinessUnavailability,
  deleteBusinessUnavailability,
} from "../services/business.service";

export async function getBusinessUnavailabilitiesHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const unavailabilities = await getBusinessUnavailabilities(businessId);
    return res.json({ unavailabilities });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function createBusinessUnavailabilityHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { date, reason } = req.body;
    const unavailability = await createBusinessUnavailability(businessId, { date, reason });
    return res.status(201).json({ unavailability });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}

export async function deleteBusinessUnavailabilityHandler(req: Request, res: Response) {
  try {
    const { businessId } = req.user!;
    const { unavailabilityId } = req.params;
    await deleteBusinessUnavailability(businessId, unavailabilityId);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
```

- [ ] **Step 4: Wire routes**

Replace `backend/src/routes/business.routes.ts` with:

```typescript
import { Router } from "express";
import {
  getBusinessHandler,
  updateBusinessHandler,
  getBusinessUnavailabilitiesHandler,
  createBusinessUnavailabilityHandler,
  deleteBusinessUnavailabilityHandler,
} from "../controllers/business.controller";
import { validate } from "../middleware/validate";
import {
  updateBusinessBody,
  businessUnavailabilityIdParam,
  createBusinessUnavailabilityBody,
} from "../validators";

const router = Router();

router.get("/", getBusinessHandler);
router.patch("/", validate(updateBusinessBody), updateBusinessHandler);

router.get("/unavailabilities", getBusinessUnavailabilitiesHandler);
router.post(
  "/unavailabilities",
  validate(createBusinessUnavailabilityBody),
  createBusinessUnavailabilityHandler
);
router.delete(
  "/unavailabilities/:unavailabilityId",
  validate(businessUnavailabilityIdParam, "params"),
  deleteBusinessUnavailabilityHandler
);

export default router;
```

- [ ] **Step 5: Verify backend compiles**

Run from `backend/`:
```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add backend/src/validators/index.ts backend/src/services/business.service.ts backend/src/controllers/business.controller.ts backend/src/routes/business.routes.ts
git commit -m "feat: add business unavailability CRUD endpoints"
```

---

## Task 3: Availability Integration

**Files:**
- Modify: `backend/src/services/professionals.service.ts`

The `getAvailability()` method (line 191) must return `slots: []` immediately when the requested date is marked as closed for the business.

- [ ] **Step 1: Add closure check inside `getAvailability()`**

In `backend/src/services/professionals.service.ts`, after the business/professional fetch (after line 205, before fetching schedules), add:

```typescript
// Check business-wide closure for this date
const dateString = day.toFormat("yyyy-MM-dd"); // 'day' is already a Luxon DateTime at this point
const businessClosure = await prisma.businessUnavailability.findUnique({
  where: { businessId_date: { businessId, date: dateString } },
});
if (businessClosure) {
  return { date, professionalId, serviceId, stepMin, slots: [] };
}
```

Place this block right after line 218 (`if (!day.isValid) throw badRequest("Invalid date");`) and before the `dayOfWeek` computation. The exact insertion point:

```typescript
// EXISTING:
const day = DateTime.fromISO(date, { zone: TZ });
if (!day.isValid) throw badRequest("Invalid date");

// ADD HERE ↓
const closedDay = await prisma.businessUnavailability.findUnique({
  where: { businessId_date: { businessId, date } },
});
if (closedDay) {
  return { date, professionalId, serviceId, stepMin, slots: [] };
}

// EXISTING continues:
const dayOfWeek = day.weekday % 7;
```

Note: `date` is already a `yyyy-MM-dd` string (the function parameter), so it matches exactly what's stored in the DB.

- [ ] **Step 2: Verify backend compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/professionals.service.ts
git commit -m "feat: block availability slots on business closure dates"
```

---

## Task 4: Frontend — API + Hooks

**Files:**
- Create: `frontend/src/services/business.api.ts`
- Create: `frontend/src/hooks/useBusinessUnavailabilities.ts`

- [ ] **Step 1: Create API service**

Create `frontend/src/services/business.api.ts`:

```typescript
import { apiFetch } from "./api";

export type BusinessUnavailability = {
  id: string;
  businessId: string;
  date: string; // yyyy-MM-dd
  reason: string | null;
  createdAt: string;
};

export function getBusinessUnavailabilities() {
  return apiFetch<{ unavailabilities: BusinessUnavailability[] }>("/business/unavailabilities");
}

export function createBusinessUnavailability(data: { date: string; reason?: string | null }) {
  return apiFetch<{ unavailability: BusinessUnavailability }>("/business/unavailabilities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteBusinessUnavailability(id: string) {
  return apiFetch<void>(`/business/unavailabilities/${id}`, { method: "DELETE" });
}
```

- [ ] **Step 2: Create hooks**

Create `frontend/src/hooks/useBusinessUnavailabilities.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBusinessUnavailabilities,
  createBusinessUnavailability,
  deleteBusinessUnavailability,
} from "../services/business.api";

export function useBusinessUnavailabilities() {
  return useQuery({
    queryKey: ["business-unavailabilities"],
    queryFn: getBusinessUnavailabilities,
  });
}

export function useCreateBusinessUnavailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; reason?: string | null }) =>
      createBusinessUnavailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-unavailabilities"] });
    },
  });
}

export function useDeleteBusinessUnavailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBusinessUnavailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-unavailabilities"] });
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/business.api.ts frontend/src/hooks/useBusinessUnavailabilities.ts
git commit -m "feat: add business unavailability API service and hooks"
```

---

## Task 5: Frontend — ClosedDaysSection UI + Settings Integration

**Files:**
- Create: `frontend/src/components/settings/ClosedDaysSection.tsx`
- Modify: `frontend/src/pages/BusinessSettingsPage.tsx`

- [ ] **Step 1: Create the section component**

Create `frontend/src/components/settings/ClosedDaysSection.tsx`:

```tsx
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarOff, Trash2, Plus, AlertCircle } from "lucide-react";
import {
  useBusinessUnavailabilities,
  useCreateBusinessUnavailability,
  useDeleteBusinessUnavailability,
} from "../../hooks/useBusinessUnavailabilities";

export default function ClosedDaysSection() {
  const { data, isLoading } = useBusinessUnavailabilities();
  const createMutation = useCreateBusinessUnavailability();
  const deleteMutation = useDeleteBusinessUnavailability();

  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const unavailabilities = data?.unavailabilities ?? [];

  async function handleAdd() {
    if (!date) return;
    setError(null);
    try {
      await createMutation.mutateAsync({ date, reason: reason.trim() || null });
      setDate("");
      setReason("");
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <CalendarOff className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">Días cerrados</h2>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Add form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            maxLength={200}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleAdd}
            disabled={!date || createMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {createMutation.isPending ? "Guardando..." : "Agregar"}
          </button>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}

        {/* List */}
        {isLoading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : unavailabilities.length === 0 ? (
          <p className="text-sm text-slate-400">No hay días cerrados configurados.</p>
        ) : (
          <ul className="space-y-2">
            {unavailabilities.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {format(parseISO(u.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  {u.reason && (
                    <p className="text-xs text-slate-400 mt-0.5">{u.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(u.id)}
                  disabled={deleteMutation.isPending}
                  className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add to BusinessSettingsPage**

In `frontend/src/pages/BusinessSettingsPage.tsx`:

1. Add import at the top with the other component imports:

```typescript
import ClosedDaysSection from "../components/settings/ClosedDaysSection";
```

2. Find where the page renders its sections (the main return with the grid/stack of cards) and add `<ClosedDaysSection />` after the business info section and before integrations/billing — it's a good spot between operational config and payment settings. Search for the `ChangePasswordSection` render or `<ChangePasswordSection />` usage and place `<ClosedDaysSection />` right before it:

```tsx
<ClosedDaysSection />
<ChangePasswordSection />
```

- [ ] **Step 3: Verify frontend compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/settings/ClosedDaysSection.tsx frontend/src/pages/BusinessSettingsPage.tsx
git commit -m "feat: add closed days management section to business settings"
```

---

## Self-Review

**Spec coverage:**
- ✅ New Prisma model `BusinessUnavailability` with `date` (string), `reason?`, `businessId` — Task 1
- ✅ Unique constraint per `(businessId, date)` — prevents duplicate closures — Task 1
- ✅ CRUD backend: GET, POST, DELETE — Task 2
- ✅ Availability blocked on closed dates (returns `slots: []`) — Task 3
- ✅ Both per-professional (`getAvailability`) and aggregated availability affected (aggregated calls `getAvailability` internally) — Task 3
- ✅ Frontend API + hooks — Task 4
- ✅ Admin UI in Settings with date picker, optional reason, list with delete — Task 5
- ✅ 409 response when date already exists — Task 2

**Placeholder scan:** No TODOs or TBDs found.

**Type consistency:** `BusinessUnavailability` type defined in `business.api.ts` (Task 4, Step 1) matches the Prisma model fields. `date` is always `string` (yyyy-MM-dd) throughout. Mutation functions in hooks match API function signatures.
