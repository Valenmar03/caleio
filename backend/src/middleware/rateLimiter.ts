import rateLimit from "express-rate-limit";

// Rutas de auth sensibles: login, register, forgot-password, reset-password, verify-email
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intentá de nuevo en 15 minutos." },
});

// Rutas públicas de reserva (sin auth)
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intentá de nuevo en un momento." },
});

// API interna (usuarios autenticados)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intentá de nuevo en un momento." },
});
