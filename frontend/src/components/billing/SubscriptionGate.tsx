import { useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, MessageCircle } from "lucide-react";
import { getBillingStatus, createCheckout, createPortal } from "../../services/billing.api";

const CONTACT_WHATSAPP = "https://wa.me/5491112345678";

function isBlocked(
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED",
  trialEndsAt: string | null,
  billingExempt: boolean
): boolean {
  if (billingExempt) return false;
  if (status === "ACTIVE") return false;
  if (status === "TRIAL" && trialEndsAt && new Date(trialEndsAt) > new Date()) return false;
  return true;
}

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["billingStatus"],
    queryFn: getBillingStatus,
    refetchInterval: 60_000,
  });

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
    onSuccess: ({ url }) => { window.location.href = url; },
  });

  const portalMutation = useMutation({
    mutationFn: createPortal,
    onSuccess: ({ url }) => { window.open(url, "_blank"); },
  });

  if (isLoading || !data) return <>{children}</>;

  const blocked = isBlocked(data.subscriptionStatus, data.trialEndsAt, data.billingExempt);

  if (!blocked) return <>{children}</>;

  const isPastDue = data.subscriptionStatus === "PAST_DUE";

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CreditCard className="w-7 h-7 text-teal-600" />
          </div>

          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            {isPastDue ? "Pago pendiente" : "Tu período de prueba terminó"}
          </h2>

          <p className="text-sm text-slate-500 mb-6">
            {isPastDue
              ? "Hay un problema con tu método de pago. Actualizalo para seguir usando Caleio."
              : "Para continuar usando Caleio necesitás suscribirte al plan."}
          </p>

          {/* Plan details */}
          {!isPastDue && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Caleio Pro</span>
                <span className="text-sm font-bold text-teal-600">$16.000 ARS/mes</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-teal-500 rounded-full" />
                  Hasta 2 profesionales incluidos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-teal-500 rounded-full" />
                  Agenda y gestión de turnos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-teal-500 rounded-full" />
                  Notificaciones por email
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-teal-500 rounded-full" />
                  Reservas online para clientes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-teal-500 rounded-full" />
                  Métricas y análisis del negocio
                </li>
              </ul>
            </div>
          )}

          <button
            onClick={() =>
              isPastDue ? portalMutation.mutate() : checkoutMutation.mutate()
            }
            disabled={checkoutMutation.isPending || portalMutation.isPending}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl py-3 text-sm transition-colors disabled:opacity-60 mb-3"
          >
            {checkoutMutation.isPending || portalMutation.isPending
              ? "Cargando..."
              : isPastDue
              ? "Actualizar método de pago"
              : "Suscribirme ahora"}
          </button>

          <a
            href={CONTACT_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            ¿Tenés dudas? Hablá con nosotros
          </a>
        </div>
      </div>
    </>
  );
}
