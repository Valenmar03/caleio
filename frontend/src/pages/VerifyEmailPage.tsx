import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Caleio</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de turnos</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          {status === "loading" && (
            <>
              <div className="text-3xl mb-3">⏳</div>
              <p className="text-sm text-slate-500">Verificando tu email...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-3xl mb-3">✅</div>
              <h2 className="text-base font-semibold text-slate-800 mb-2">Email confirmado</h2>
              <p className="text-sm text-slate-500 mb-4">
                Tu cuenta fue activada correctamente.
              </p>
              <Link
                to="/login"
                className="inline-block py-2 px-6 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
              >
                Ir al login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-3xl mb-3">❌</div>
              <h2 className="text-base font-semibold text-slate-800 mb-2">Link inválido</h2>
              <p className="text-sm text-slate-500 mb-4">
                El link de verificación es inválido o ya expiró.
              </p>
              <Link
                to="/register"
                className="text-sm text-teal-600 hover:underline"
              >
                Volver al registro
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
