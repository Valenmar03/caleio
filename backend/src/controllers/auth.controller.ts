import { Request, Response } from "express";
import * as authService from "../services/auth.service";

const COOKIE_NAME = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export async function registerHandler(req: Request, res: Response) {
  try {
    const { email, password, businessName, slug } = req.body;
    if (!email || !password || !businessName || !slug) {
      return res.status(400).json({ error: "email, password, businessName and slug are required" });
    }

    const result = await authService.register(email, password, businessName, slug);
    return res.status(201).json({ user: result.user });
  } catch (err: any) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }
}

export async function verifyEmailHandler(req: Request, res: Response) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "token is required" });

    await authService.verifyEmail(token);
    return res.json({ message: "Email verified successfully" });
  } catch (err: any) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    await authService.forgotPassword(email);
    return res.json({ message: "If that email exists, a reset link was sent" });
  } catch (err: any) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "token and password are required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    await authService.resetPassword(token, password);
    return res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { slug, identifier, password } = req.body;
    if (!slug || !identifier || !password) {
      return res.status(400).json({ error: "slug, identifier and password are required" });
    }

    const result = await authService.login(slug, identifier, password);
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
    return res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err: any) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME];
    if (!rawToken) {
      return res.status(401).json({ error: "No refresh token" });
    }

    const result = await authService.refresh(rawToken);
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
    return res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err: any) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }
}

export async function changePasswordHandler(req: Request, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
    }

    const userId = (req as any).user?.userId;
    await authService.changePassword(userId, currentPassword, newPassword);
    return res.json({ message: "Contraseña actualizada" });
  } catch (err: any) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME];
    if (rawToken) {
      await authService.logout(rawToken);
    }
    res.clearCookie(COOKIE_NAME);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }
}

export async function getBusinessBySlugHandler(req: Request, res: Response) {
  try {
    const slug = req.params.slug as string;
    const business = await authService.getBusinessBySlug(slug);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }
    return res.json(business);
  } catch (err: any) {
    return res.status(err.statusCode ?? 500).json({ error: err.message });
  }
}
