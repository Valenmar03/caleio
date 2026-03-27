import { useQuery, useMutation } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { getBillingStatus, createCheckout } from "../../services/billing.api";

export function TrialBanner() {
  const { data } = useQuery({
    queryKey: ["billingStatus"],
    queryFn: getBillingStatus,
    refetchInterval: 60_000,
  });

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
    onSuccess: ({ url }) => { window.location.href = url; },
  });

  if (!data) return null;
  if (data.billingExempt) return null;
  if (data.subscriptionStatus !== "TRIAL") return null;
  if (!data.trialEndsAt) return null;

  const daysLeft = differenceInDays(new Date(data.trialEndsAt), new Date());
  if (daysLeft > 1) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-amber-700">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          {daysLeft <= 0
            ? "Tu período de prueba vence hoy."
            : `Tu período de prueba vence mañana.`}{" "}
          Suscribite para no perder el acceso.
        </span>
      </div>
      <button
        onClick={() => checkoutMutation.mutate()}
        disabled={checkoutMutation.isPending}
        className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
      >
        {checkoutMutation.isPending ? "..." : "Suscribirme"}
      </button>
    </div>
  );
}
