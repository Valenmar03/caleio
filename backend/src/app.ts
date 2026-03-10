import express from "express";
import cors from "cors";
import { prisma } from "./db/prisma";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "lumina-api" });
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, db: "error" });
  }
});

app.use(routes);

export default app;