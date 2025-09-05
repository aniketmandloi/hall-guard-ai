import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import { verifyWebhookSignature } from "@/lib/polar";

export async function POST(req: NextRequest) {
  console.log("🔄 Polar webhook request received");
  const reqText = await req.text();
  console.log("📝 Request headers:", Object.fromEntries(req.headers.entries()));
  return webhooksHandler(reqText, req);
}

// Utility function to safely parse dates
function safeParseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

async function handleSubscriptionEvent(
  data: any,
  type:
    | "subscription.created"
    | "subscription.updated"
    | "subscription.canceled"
    | "subscription.active"
    | "subscription.revoked"
    | "subscription.uncanceled"
) {
  console.log(`🎯 Processing subscription webhook: ${type}`);
  console.log("📦 Payload data:", JSON.stringify(data, null, 2));

  try {
    // Extract user ID from customer external ID (this should be the Clerk user ID)
    const userId = data.customer?.externalId;
    const customerEmail = data.customer?.email;

    if (!userId || !customerEmail) {
      console.error("Missing userId or email from webhook payload");
      return NextResponse.json({
        status: 400,
        error: "Missing required customer data",
      });
    }

    // Build subscription data for Prisma
    const subscriptionData = {
      polarSubscriptionId: data.id,
      polarCustomerId: data.customerId,
      productId: data.productId,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      recurringInterval: data.recurringInterval,
      currentPeriodStart: new Date(data.currentPeriodStart),
      currentPeriodEnd: new Date(data.currentPeriodEnd),
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      canceledAt: safeParseDate(data.canceledAt),
      startedAt: safeParseDate(data.startedAt) || new Date(),
      endsAt: safeParseDate(data.endsAt),
      endedAt: safeParseDate(data.endedAt),
      checkoutId: data.checkoutId || "",
      userId,
      email: customerEmail,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      customFieldData: data.customFieldData
        ? JSON.stringify(data.customFieldData)
        : null,
      discountId: data.discountId || null,
      customerCancellationReason: data.customerCancellationReason || null,
      customerCancellationComment: data.customerCancellationComment || null,
    };

    console.log("💾 Final subscription data:", {
      polarSubscriptionId: subscriptionData.polarSubscriptionId,
      status: subscriptionData.status,
      userId: subscriptionData.userId,
      amount: subscriptionData.amount,
    });

    // Upsert subscription data
    const upsertedSubscription = await prisma.subscription.upsert({
      where: { polarSubscriptionId: data.id },
      update: {
        status: subscriptionData.status,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
        currentPeriodStart: subscriptionData.currentPeriodStart,
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
        canceledAt: subscriptionData.canceledAt,
        endsAt: subscriptionData.endsAt,
        endedAt: subscriptionData.endedAt,
        metadata: subscriptionData.metadata,
        customFieldData: subscriptionData.customFieldData,
        customerCancellationReason: subscriptionData.customerCancellationReason,
        customerCancellationComment:
          subscriptionData.customerCancellationComment,
        modifiedTime: new Date(),
      },
      create: subscriptionData,
    });

    // Update user's subscription reference if active
    if (data.status === "active") {
      await prisma.user.updateMany({
        where: { userId },
        data: { subscription: data.id },
      });
    } else if (data.status === "canceled" || data.status === "revoked") {
      await prisma.user.updateMany({
        where: { userId },
        data: { subscription: null },
      });
    }

    console.log("✅ Upserted subscription:", data.id);
    return NextResponse.json({
      status: 200,
      message: `Subscription ${type} processed successfully`,
      data: upsertedSubscription,
    });
  } catch (error) {
    console.error("💥 Error processing subscription webhook:", error);
    return NextResponse.json({
      status: 500,
      error: `Error processing subscription ${type}`,
    });
  }
}

async function handleCheckoutCompletedEvent(data: any) {
  console.log("🎯 Processing order paid/checkout completed webhook");
  console.log("📦 Order data:", JSON.stringify(data, null, 2));

  try {
    const userId = data.customer?.externalId;
    const customerEmail = data.customer?.email;

    if (!userId || !customerEmail) {
      console.error("Missing userId or email from order webhook payload");
      return NextResponse.json({
        status: 400,
        error: "Missing required customer data from order",
      });
    }

    // Check if this order has subscription items
    if (data.subscription && data.subscription.id) {
      console.log(
        "🔄 Order contains subscription, creating subscription record"
      );

      // Create subscription record from order data
      const subscriptionData = {
        polarSubscriptionId: data.subscription.id,
        polarCustomerId: data.customerId,
        productId: data.subscription.productId || data.products?.[0]?.productId,
        status: data.subscription.status || "active",
        amount: data.amount,
        currency: data.currency,
        recurringInterval: data.subscription.recurringInterval || "month",
        currentPeriodStart: new Date(
          data.subscription.currentPeriodStart || data.createdAt
        ),
        currentPeriodEnd: new Date(
          data.subscription.currentPeriodEnd ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
        cancelAtPeriodEnd: false,
        startedAt: new Date(data.subscription.startedAt || data.createdAt),
        checkoutId: data.checkoutId || "",
        userId,
        email: customerEmail,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      };

      // Create subscription record
      const upsertedSubscription = await prisma.subscription.upsert({
        where: { polarSubscriptionId: data.subscription.id },
        update: {
          status: subscriptionData.status,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
          currentPeriodStart: subscriptionData.currentPeriodStart,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          modifiedTime: new Date(),
        },
        create: subscriptionData,
      });

      // Update user's subscription reference
      await prisma.user.updateMany({
        where: { userId },
        data: { subscription: data.subscription.id },
      });

      console.log("✅ Subscription created from order for user:", userId);
      return NextResponse.json({
        status: 200,
        message: "Order processed and subscription created successfully",
        data: upsertedSubscription,
      });
    }

    // For non-subscription orders (one-time payments)
    console.log("✅ Order completed (one-time payment) for user:", userId);

    return NextResponse.json({
      status: 200,
      message: "Order completed successfully",
    });
  } catch (error) {
    console.error("💥 Error processing order webhook:", error);
    return NextResponse.json({
      status: 500,
      error: "Error processing order",
    });
  }
}

async function webhooksHandler(
  reqText: string,
  request: NextRequest
): Promise<NextResponse> {
  console.log("🎯 Processing Polar webhook request");

  // Get webhook signature from headers
  const signature =
    request.headers.get("webhook-signature") ||
    request.headers.get("polar-signature") ||
    "";
  console.log("🔑 Webhook signature present:", !!signature);

  // Verify webhook signature (placeholder - implement actual verification)
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET!;
  if (!verifyWebhookSignature(reqText, signature, webhookSecret)) {
    console.error("❌ Webhook signature verification failed");
    return NextResponse.json({
      status: 401,
      error: "Webhook signature verification failed",
    });
  }

  try {
    const webhookPayload = JSON.parse(reqText);
    const { data, type } = webhookPayload;

    console.log("✅ Webhook payload parsed successfully:", {
      type,
      dataId: data?.id,
    });

    // Handle different webhook types
    switch (type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.active":
      case "subscription.revoked":
      case "subscription.uncanceled":
        return handleSubscriptionEvent(data, type);

      case "checkout.created":
      case "checkout.updated":
        // These are typically informational, no action needed
        return NextResponse.json({
          status: 200,
          message: `Checkout ${type.split(".")[1]} acknowledged`,
        });

      case "order.created":
      case "order.paid":
        return handleCheckoutCompletedEvent(data);

      default:
        console.log(`⚠️ Unhandled webhook type: ${type}`);
        return NextResponse.json({
          status: 200,
          message: `Unhandled event type: ${type}`,
        });
    }
  } catch (err) {
    console.error("Error processing Polar webhook:", err);
    return NextResponse.json({
      status: 500,
      error: "Webhook processing error",
    });
  }
}
