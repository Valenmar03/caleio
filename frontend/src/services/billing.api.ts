import { apiFetch } from "./api";

export function createCheckout() {
  return apiFetch<{ url: string }>("/billing/checkout", { method: "POST" });
}

export function createPortal() {
  return apiFetch<{ url: string }>("/billing/portal", { method: "POST" });
}

export function getBillingStatus() {
  return apiFetch<{
    subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
    trialEndsAt: string | null;
    billingExempt: boolean;
    lsSubscriptionId: string | null;
  }>("/billing/status");
}
