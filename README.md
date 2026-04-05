# Caleio

Plataforma SaaS de gestión de turnos y agenda para negocios de estética, peluquerías, barberías y profesionales independientes.

---

## Descripción

Caleio permite a negocios administrar su agenda, profesionales, servicios y clientes desde un panel web. Cada negocio tiene su propia página de reservas pública donde los clientes pueden reservar turnos online de forma autónoma.

---

## Funcionalidades principales

### Panel de administración
- **Agenda diaria/semanal** — vista por profesional, con drag & drop de turnos
- **Gestión de turnos** — crear, editar, reprogramar, cancelar con validación de solapamientos
- **Profesionales** — horarios individuales, servicios asignados, bloqueos de agenda
- **Servicios** — duración, precio, seña requerida, visibilidad online
- **Clientes** — historial de turnos, datos de contacto, notas
- **Dashboard** — métricas del día: ingresos, turnos completados, desglose por método de pago
- **Configuración** — perfil del negocio, logo, dirección, WhatsApp, link de reservas

### Página de reservas pública
- Flujo paso a paso: servicio → profesional → fecha/horario → datos → confirmación
- Disponibilidad calculada en tiempo real según horarios y turnos existentes
- Soporte de señas con pago online via **MercadoPago**
- **10 temas visuales** personalizables por negocio (colores, tipografía, paleta)
- Logo del negocio, tagline, botones de ubicación y WhatsApp

### Otras features
- Autenticación con JWT + refresh tokens, verificación de email
- Recordatorios automáticos por email (configurable en horas)
- Bloqueos de agenda con detección de conflictos (HTTP 409 + resolución manual)
- Upload de logo con preview instantáneo (cache-busting)
- Google Maps autocomplete para dirección
- Suscripciones y planes via **Lemon Squeezy**
- Rate limiting, CORS, validación con Zod

---

## Stack

### Frontend
| Tecnología | Uso |
|---|---|
| React 19 + TypeScript | UI |
| Vite | Bundler |
| Tailwind CSS v4 | Estilos |
| React Query (TanStack) | Server state |
| React Router v7 | Navegación |
| Recharts | Gráficos del dashboard |
| date-fns | Manejo de fechas |
| Lucide React | Íconos |

### Backend
| Tecnología | Uso |
|---|---|
| Node.js + Express 5 | API REST |
| TypeScript | Tipado |
| Prisma ORM | Acceso a datos |
| PostgreSQL | Base de datos |
| Zod | Validación de inputs |
| Multer | Upload de archivos |
| Nodemailer | Emails transaccionales |
| node-cron | Recordatorios automáticos |
| bcrypt + JWT | Autenticación |

---

## Modelo de datos (simplificado)

```
Business
  ├── Users (OWNER / PRO)
  ├── Professionals
  │   ├── ProfessionalSchedule
  │   ├── ProfessionalUnavailability
  │   └── ProfessionalService (M:N con Service)
  ├── Services
  ├── Clients
  └── Appointments
        ├── status: RESERVED | DEPOSIT_PAID | COMPLETED | CANCELED | NO_SHOW
        └── depositAmount, finalPaymentMethod, reminderSentAt
```

---

## Estructura del proyecto

```
lumina/
├── frontend/          # React app (Vite)
│   ├── src/
│   │   ├── pages/     # BookingPage, Dashboard, Agenda, Clientes...
│   │   ├── components/
│   │   ├── hooks/     # useAgendaDaily, useAvailability, useBusiness...
│   │   └── services/  # Capa HTTP (api.ts + entidades)
│   └── public/
│       └── theme-previews/   # Capturas de vista previa por tema
└── backend/           # Express API
    ├── src/
    │   ├── controllers/
    │   ├── services/
    │   ├── routes/
    │   └── validators/
    └── prisma/
        ├── schema.prisma
        └── migrations/
```

---

## Setup local

### Requisitos
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
cp .env.example .env   # completar DATABASE_URL y JWT_SECRET
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La app corre en `http://localhost:5173` y la API en `http://localhost:3000`.

---

## Variables de entorno (backend)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
MP_CLIENT_ID=...          # MercadoPago (opcional)
MP_CLIENT_SECRET=...
LS_API_KEY=...            # Lemon Squeezy (opcional)
SMTP_HOST=...             # Emails (opcional)
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

```env
# frontend (.env)
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=...   # opcional, fallback a input plain
```

---

## Licencia

Privado — todos los derechos reservados.
