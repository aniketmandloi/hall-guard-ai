import { Polar } from "@polar-sh/sdk";

// Initialize Polar SDK client
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server:
    (process.env.POLAR_SERVER_URL as "sandbox" | "production") || "sandbox",
});

// Types for Polar operations
export interface PolarCheckoutSession {
  id: string;
  url: string;
  customerId?: string;
  productId: string;
  successUrl?: string;
  customerEmail?: string;
}

export interface PolarCustomer {
  id: string;
  email: string;
  name?: string;
  externalId?: string;
}

export interface PolarProduct {
  id: string;
  name: string;
  description?: string;
  prices: PolarPrice[];
}

export interface PolarPrice {
  id: string;
  amount: number;
  currency: string;
  recurringInterval?: "month" | "year";
}

export interface PolarSubscription {
  id: string;
  customerId: string;
  productId: string;
  status: "active" | "canceled" | "past_due" | "incomplete";
  amount: number;
  currency: string;
  recurringInterval: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  startedAt: string;
  endsAt?: string;
  endedAt?: string;
  checkoutId: string;
  metadata?: Record<string, any>;
  customFieldData?: Record<string, any>;
}

/**
 * Create or get a Polar customer
 */
export async function createOrGetCustomer(
  email: string,
  name?: string,
  externalId?: string
): Promise<PolarCustomer> {
  try {
    // Try to find existing customer by email
    const existingCustomers = await polar.customers.list({
      email,
      limit: 1,
    });

    if (
      existingCustomers.result?.items &&
      existingCustomers.result.items.length > 0
    ) {
      return existingCustomers.result.items[0] as PolarCustomer;
    }

    // Create new customer if not found
    const newCustomer = await polar.customers.create({
      email,
      name,
      externalId,
    });

    return newCustomer as PolarCustomer;
  } catch (error) {
    console.error("Error creating/getting Polar customer:", error);
    throw error;
  }
}

/**
 * Create a checkout session for a product
 */
export async function createCheckoutSession(
  productId: string,
  customerEmail: string,
  successUrl?: string,
  metadata?: Record<string, any>
): Promise<PolarCheckoutSession> {
  try {
    // First ensure customer exists
    const customer = await createOrGetCustomer(customerEmail);

    const checkout = await polar.checkouts.create({
      products: [productId],
      customerId: customer.id,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      metadata,
    });

    return {
      id: checkout.id,
      url: checkout.url!,
      customerId: customer.id,
      productId,
      successUrl,
      customerEmail,
    };
  } catch (error) {
    console.error("Error creating Polar checkout session:", error);
    throw error;
  }
}

/**
 * Get product information
 */
export async function getProduct(productId: string): Promise<PolarProduct> {
  try {
    const product = await polar.products.get({
      id: productId,
    });

    return product as unknown as PolarProduct;
  } catch (error) {
    console.error("Error fetching Polar product:", error);
    throw error;
  }
}

/**
 * Get customer subscriptions
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<PolarSubscription[]> {
  try {
    const subscriptions = await polar.subscriptions.list({
      customerId,
    });

    return (
      subscriptions.result?.items?.map(
        (sub) =>
          ({
            ...sub,
            currentPeriodStart: sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toISOString() : new Date().toISOString(),
            currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : new Date().toISOString(),
            startedAt: sub.startedAt ? new Date(sub.startedAt).toISOString() : new Date().toISOString(),
            canceledAt: sub.canceledAt
              ? new Date(sub.canceledAt).toISOString()
              : undefined,
            endsAt: sub.endsAt ? new Date(sub.endsAt).toISOString() : undefined,
            endedAt: sub.endedAt
              ? new Date(sub.endedAt).toISOString()
              : undefined,
          } as PolarSubscription)
      ) || []
    );
  } catch (error) {
    console.error("Error fetching customer subscriptions:", error);
    throw error;
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<PolarSubscription> {
  try {
    const subscription = await polar.subscriptions.get({
      id: subscriptionId,
    });

    return {
      ...subscription,
      currentPeriodStart: subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).toISOString() : new Date().toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toISOString() : new Date().toISOString(),
      startedAt: subscription.startedAt ? new Date(subscription.startedAt).toISOString() : new Date().toISOString(),
      canceledAt: subscription.canceledAt
        ? new Date(subscription.canceledAt).toISOString()
        : undefined,
      endsAt: subscription.endsAt
        ? new Date(subscription.endsAt).toISOString()
        : undefined,
      endedAt: subscription.endedAt
        ? new Date(subscription.endedAt).toISOString()
        : undefined,
    } as PolarSubscription;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<PolarSubscription> {
  try {
    const subscription = await polar.subscriptions.update({
      id: subscriptionId,
      subscriptionUpdate: {
        cancelAtPeriodEnd: true,
      },
    });

    return {
      ...subscription,
      currentPeriodStart: subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).toISOString() : new Date().toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toISOString() : new Date().toISOString(),
      startedAt: subscription.startedAt ? new Date(subscription.startedAt).toISOString() : new Date().toISOString(),
      canceledAt: subscription.canceledAt
        ? new Date(subscription.canceledAt).toISOString()
        : undefined,
      endsAt: subscription.endsAt
        ? new Date(subscription.endsAt).toISOString()
        : undefined,
      endedAt: subscription.endedAt
        ? new Date(subscription.endedAt).toISOString()
        : undefined,
    } as PolarSubscription;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

/**
 * Get customer portal URL for subscription management
 */
export async function getCustomerPortalUrl(
  customerId: string
): Promise<string> {
  try {
    // Polar customer portal URL - this may need to be implemented differently
    // based on the actual Polar SDK API
    return `https://polar.sh/portal/${customerId}`;
  } catch (error) {
    console.error("Error getting customer portal URL:", error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  _payload: string,
  _signature: string,
  _secret: string
): boolean {
  try {
    // Polar webhook signature verification
    // This is a simplified version - you may need to implement proper verification
    // based on Polar's webhook signature scheme
    return true; // Placeholder - implement proper verification
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

export default polar;
