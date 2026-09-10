import { Request, Response, NextFunction } from "express";

/**
 * Restringe una ruta al rol OWNER.
 *
 * El guard OwnerRoute del frontend solo esconde pantallas: cualquier usuario
 * PRO autenticado puede llamar la API directamente, así que las rutas
 * administrativas tienen que validar el rol del lado del servidor.
 *
 * Va siempre después de authenticate(), que es quien puebla req.user.
 */
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "OWNER") {
    return res.status(403).json({ error: "Requiere permisos de owner" });
  }
  next();
}
