import crypto from "crypto";
import { lemonSqueezySetup, createCheckout, getSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { prisma } from "../db/prisma";

function setup() {
  lemonSqueezySetup({ apiKey: process.env.LS_API_KEY! });
}

const STORE_ID = () => process.env.LS_STORE_ID!;
const VARIANT_ID_ARS = () => process.env.LS_VARIANT_ID_ARS!;
const WEBHOOK_SECRET = () => process.env.LS_WEBHOOK_SECRET!;
const FRONTEND_URL = () => process.env.FRONTEND_URL ?? "http://localhost:5173";

export const billingService = {
  async createCheckoutUrl(businessId: string): Promise<string> {
    setup();

    const result = await createCheckout(STORE_ID(), VARIANT_ID_ARS(), {
      checkoutData: {
        custom: { businessId },
      },
      productOptions: {
        redirectUrl: `${FRONTEND_URL()}/`,
        receiptButtonText: "Ir a Caleio",
        receiptThankYouNote: "Gracias por suscribirte a Caleio.",
      },
    });

    if (result.error) {
      console.error("LS checkout error:", result.error);
      throw Object.assign(new Error("Error al crear el checkout"), { status: 500 });
    }

    return result.data.data.attributes.url;
  },

  async createPortalUrl(businessId: string): Promise<string> {
    setup();

    const business = await prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { lsSubscriptionId: true },
    });

    if (!business.lsSubscriptionId) {
      throw Object.assign(new Error("Sin suscripción activa"), { status: 400 });
    }

    const result = await getSubscription(business.lsSubscriptionId);
    if (result.error) {
      console.error("LS subscription error:", result.error);
      throw Object.assign(new Error("Error al obtener la suscripción"), { status: 500 });
    }

    const portalUrl = result.data.data.attributes.urls?.customer_portal;
    if (!portalUrl) throw Object.assign(new Error("Portal no disponible"), { status: 400 });

    return portalUrl;
  },

  async getStatus(businessId: string) {
    return prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        subscriptionStatus: true,
        trialEndsAt: true,
        billingExempt: true,
        lsSubscriptionId: true,
      },
    });
  },

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET());
    const digest = hmac.update(rawBody).digest("hex");

    if (digest !== signature) {
      throw Object.assign(new Error("Invalid webhook signature"), { status: 401 });
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    const eventName: string = payload.meta?.event_name ?? "";
    const businessId: string | undefined = payload.meta?.custom_data?.businessId;
    const lsSubscriptionId = String(payload.data?.id ?? "");
    const lsCustomerId = String(payload.data?.attributes?.customer_id ?? "");
    const lsStatus: string = payload.data?.attributes?.status ?? "";

    if (!businessId) return;

    const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED"> = {
      active: "ACTIVE",
      past_due: "PAST_DUE",
      cancelled: "CANCELED",
      expired: "CANCELED",
      unpaid: "PAST_DUE",
    };

    if (eventName === "subscription_created") {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          lsCustomerId,
          lsSubscriptionId,
          subscriptionStatus: "ACTIVE",
        },
      });
    } else if (eventName === "subscription_updated") {
      const newStatus = statusMap[lsStatus];
      if (newStatus) {
        await prisma.business.update({
          where: { id: businessId },
          data: { subscriptionStatus: newStatus },
        });
      }
    } else if (eventName === "subscription_payment_failed") {
      await prisma.business.update({
        where: { id: businessId },
        data: { subscriptionStatus: "PAST_DUE" },
      });
    } else if (eventName === "subscription_cancelled") {
      await prisma.business.update({
        where: { id: businessId },
        data: { subscriptionStatus: "CANCELED" },
      });
    }
  },
};
