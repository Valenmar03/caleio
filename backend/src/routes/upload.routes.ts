import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { uploadLogoHandler } from "../controllers/upload.controller";
import { requireOwner } from "../middleware/requireOwner";

/**
 * La extensión del archivo se deriva del mime type validado, NUNCA del nombre
 * original que manda el cliente: si no, se puede guardar el logo como .html o
 * .svg y express.static lo sirve como documento ejecutable en el mismo origen
 * que la API (XSS almacenado → robo de sesión vía /auth/refresh).
 *
 * SVG queda excluido a propósito: admite <script> embebido.
 */
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const LOGOS_DIR = path.join(__dirname, "..", "..", "public", "uploads", "logos");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
    cb(null, LOGOS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user!.businessId}${EXT_BY_MIME[file.mimetype]}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes JPG, PNG o WebP"));
    }
  },
});

/** Traduce los errores de multer a JSON en vez del HTML por defecto de Express. */
function handleUploadError(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "La imagen no puede superar los 2 MB"
        : "No se pudo subir el archivo";
    return res.status(400).json({ error: message });
  }
  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
}

const router = Router();

router.post("/logo", requireOwner, upload.single("logo"), handleUploadError, uploadLogoHandler);

export default router;
