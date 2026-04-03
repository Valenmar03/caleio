import { Router } from "express";
import multer from "multer";
import path from "path";
import { uploadLogoHandler } from "../controllers/upload.controller";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "public/uploads/logos"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user!.businessId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes JPG, PNG, WebP o SVG"));
    }
  },
});

const router = Router();

router.post("/logo", upload.single("logo"), uploadLogoHandler);

export default router;
