import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

type Target = "body" | "query" | "params";

export function validate(schema: ZodType, target: Target = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message).join(", ");
      return res.status(400).json({ error: messages });
    }
    // req.query and req.params are getter-only in Express 5 — only mutate body
    if (target === "body") {
      req.body = result.data;
    }
    next();
  };
}
