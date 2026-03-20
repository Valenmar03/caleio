import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "Caleio <noreply@caleio.app>";
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${APP_URL}/verificar-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Confirmá tu cuenta en Caleio",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Confirmá tu cuenta</h2>
        <p style="color: #475569; margin-bottom: 24px;">
          Hacé click en el botón para activar tu cuenta en Caleio. El link vence en 24 horas.
        </p>
        <a href="${url}"
           style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;">
          Confirmar cuenta
        </a>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
          Si no creaste una cuenta en Caleio, podés ignorar este mail.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${APP_URL}/resetear-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Resetear contraseña — Caleio",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Resetear contraseña</h2>
        <p style="color: #475569; margin-bottom: 24px;">
          Recibimos una solicitud para resetear la contraseña de tu cuenta. El link vence en 1 hora.
        </p>
        <a href="${url}"
           style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;">
          Resetear contraseña
        </a>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
          Si no pediste esto, podés ignorar este mail. Tu contraseña no cambiará.
        </p>
      </div>
    `,
  });
}
