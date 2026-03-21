import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al enviar el email");
      }

      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Error al enviar el email");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/logo.png" alt="Caleio" className="w-8 h-8 object-contain" />
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Caleio</h1>
          </div>
          <p className="text-sm text-slate-500">Gestión de turnos</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {sent ? (
            <div className="text-center py-2">
              <div className="text-3xl mb-3">📬</div>
              <h2 className="text-base font-semibold text-slate-800 mb-2">Revisá tu email</h2>
              <p className="text-sm text-slate-500">
                Si esa dirección tiene una cuenta, te enviamos un link para resetear tu contraseña. Vence en 1 hora.
              </p>
              <Link to="/login" className="inline-block mt-4 text-sm text-teal-600 hover:underline">
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-base font-medium text-slate-700 mb-1">Olvidé mi contraseña</h2>
              <p className="text-sm text-slate-400 mb-5">
                Ingresá tu email y te enviamos un link para resetearla.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="tu@email.com"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? "Enviando..." : "Enviar link"}
                </button>
                <Link
                  to="/login"
                  className="block text-center text-sm text-slate-400 hover:text-slate-600 transition"
                >
                  ← Volver al login
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
