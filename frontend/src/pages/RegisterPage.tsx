import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import PasswordInput from "../components/ui/PasswordInput";
import AR from "country-flag-icons/react/3x2/AR";
import MX from "country-flag-icons/react/3x2/MX";
import CO from "country-flag-icons/react/3x2/CO";
import CL from "country-flag-icons/react/3x2/CL";
import UY from "country-flag-icons/react/3x2/UY";
import PE from "country-flag-icons/react/3x2/PE";
import VE from "country-flag-icons/react/3x2/VE";

const API_URL = "/api";

const TIMEZONES = [
  { Flag: AR, label: "Argentina", value: "America/Argentina/Buenos_Aires" },
  { Flag: MX, label: "México", value: "America/Mexico_City" },
  { Flag: CO, label: "Colombia", value: "America/Bogota" },
  { Flag: CL, label: "Chile", value: "America/Santiago" },
  { Flag: UY, label: "Uruguay", value: "America/Montevideo" },
  { Flag: PE, label: "Perú", value: "America/Lima" },
  { Flag: VE, label: "Venezuela", value: "America/Caracas" },
];

function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = TIMEZONES.find((tz) => tz.value === value) ?? TIMEZONES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-left"
      >
        <selected.Flag className="w-5 h-auto rounded-sm shrink-0" />
        <span className="flex-1">{selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {TIMEZONES.map((tz) => (
            <button
              key={tz.value}
              type="button"
              onClick={() => { onChange(tz.value); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <tz.Flag className="w-5 h-auto rounded-sm shrink-0" />
              <span className="flex-1">{tz.label}</span>
              {tz.value === value && <Check className="w-3.5 h-3.5 text-teal-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleBusinessNameChange(value: string) {
    setBusinessName(value);
    setSlug(normalizeSlug(value));
  }

  function handleSlugChange(value: string) {
    setSlug(normalizeSlug(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, businessName, slug, timezone }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error al registrar" }));
        throw new Error(data.error ?? "Error al registrar");
      }

      navigate(`/login/${slug}`, { state: { justRegistered: true, email } });
    } catch (err: any) {
      setError(err?.message ?? "Error al registrar");
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
          <>
          <h2 className="text-base font-medium text-slate-700 mb-5">Registrar negocio</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-slate-600 mb-1">
                Nombre del negocio
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                placeholder="Peluquería María"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-600 mb-1">
                URL del negocio
              </label>
              <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                <span className="px-3 py-2 text-sm text-slate-400 bg-slate-50 border-r border-slate-200 whitespace-nowrap">
                  app.caleio.app/
                </span>
                <input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  placeholder="peluqueria-maria"
                />
              </div>
              {slug && (
                <p className="mt-1 text-xs text-slate-400">
                  Tus profesionales ingresarán en: <span className="text-teal-600 font-medium">app.caleio.app/login/{slug}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                País / Zona horaria
              </label>
              <TimezoneSelect value={timezone} onChange={setTimezone} />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">
                Contraseña
              </label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                placeholder="••••••••"
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
              {isSubmitting ? "Registrando..." : "Crear negocio"}
            </button>
            <p className="text-center text-sm text-slate-500">
              ¿Ya tenés cuenta?{" "}
              <a href="/login" className="text-teal-600 hover:underline font-medium">
                Iniciá sesión
              </a>
            </p>
          </form>
          </>
        </div>
      </div>
    </div>
  );
}
