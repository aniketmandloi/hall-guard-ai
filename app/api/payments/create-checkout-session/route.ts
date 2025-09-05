import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/polar";

export async function POST(req: NextRequest) {
  try {
    const { userId, email, productId, subscription } = await req.json();

    console.log("Creating Polar checkout session for:", { userId, email, productId, subscription });

    // Validate required fields
    if (!userId || !email || !productId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, email, or productId" },
        { status: 400 }
      );
    }

    // Create metadata to track the user and subscription type
    const metadata = {
      userId,
      email,
      subscription: subscription ? "true" : "false",
    };

    // Define success URL
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/success`;

    // Create checkout session using Polar
    const checkoutSession = await createCheckoutSession(
      productId,
      email,
      successUrl,
      metadata
    );

    return NextResponse.json({
      sessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url,
      customerId: checkoutSession.customerId,
    });
  } catch (error) {
    console.error("Error creating Polar checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
