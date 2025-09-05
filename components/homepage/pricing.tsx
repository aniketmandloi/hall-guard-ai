"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

type PricingSwitchProps = {
  onSwitch: (value: string) => void;
};

type PricingCardProps = {
  user: any;
  handleCheckout: any;
  priceIdMonthly: any;
  priceIdYearly: any;
  isYearly?: boolean;
  title: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  description: string;
  features: string[];
  actionLabel: string;
  popular?: boolean;
  exclusive?: boolean;
};

const PricingHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="text-center mb-10">
    {/* Pill badge */}
    <div className="mx-auto w-fit rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/30 px-4 py-1 mb-6">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-200">
        <Shield className="h-4 w-4" />
        <span>Pricing</span>
      </div>
    </div>

    <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white pb-2">
      {title}
    </h2>
    <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto">
      {subtitle}
    </p>
  </div>
);

const PricingSwitch = ({ onSwitch }: PricingSwitchProps) => (
  <div className="flex justify-center items-center gap-3">
    <Tabs defaultValue="0" className="w-[400px]" onValueChange={onSwitch}>
      <TabsList className="w-full">
        <TabsTrigger value="0" className="w-full">
          Monthly
        </TabsTrigger>
        <TabsTrigger value="1" className="w-full relative" disabled>
          Yearly
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            Coming Soon
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
);

const PricingCard = ({
  user,
  handleCheckout,
  isYearly,
  title,
  priceIdMonthly,
  priceIdYearly,
  monthlyPrice,
  yearlyPrice,
  description,
  features,
  actionLabel,
  popular,
  exclusive,
}: PricingCardProps) => {
  const router = useRouter();

  console.log("priceIdMonthly", priceIdMonthly);
  return (
    <Card
      className={cn("w-full max-w-sm flex flex-col justify-between px-2 py-1", {
        "relative border-2 border-blue-500 dark:border-blue-400": popular,
        "shadow-2xl bg-gradient-to-b from-gray-900 to-gray-800 text-white":
          exclusive,
      })}
    >
      {popular && (
        <div className="absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-blue-500 dark:bg-blue-400 px-3 py-1">
          <p className="text-sm font-medium text-white">Most Popular</p>
        </div>
      )}

      <div>
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription
            className={cn("", {
              "text-gray-300": exclusive,
            })}
          >
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="flex items-baseline gap-1">
            <span
              className={cn("text-4xl font-bold", {
                "text-white": exclusive,
              })}
            >
              {monthlyPrice
                ? `$${isYearly ? yearlyPrice : monthlyPrice}`
                : "Custom"}
            </span>
            <span
              className={cn("text-muted-foreground", {
                "text-gray-300": exclusive,
              })}
            >
              /mo
            </span>
          </div>

          <div className="mt-6 space-y-2">
            {features.map((feature) => (
              <div key={feature} className="flex gap-2">
                <CheckCircle2
                  className={cn("h-5 w-5 text-blue-500", {
                    "text-blue-400": exclusive,
                  })}
                />
                <p
                  className={cn("text-muted-foreground", {
                    "text-gray-300": exclusive,
                  })}
                >
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      <CardFooter>
        <Button
          onClick={() => {
            if (!user) {
              router.push("/sign-in");
              return;
            }
            handleCheckout(isYearly ? priceIdYearly : priceIdMonthly, true);
          }}
          className={cn("w-full", {
            "bg-blue-500 hover:bg-blue-400": popular,
            "bg-white text-gray-900 hover:bg-gray-100": exclusive,
          })}
        >
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function Pricing() {
  const [isYearly, setIsYearly] = useState<boolean>(false);
  const togglePricingPeriod = (value: string) =>
    setIsYearly(parseInt(value) === 1);
  const { user } = useUser();

  const handleCheckout = async (productId: string, subscription: boolean) => {
    try {
      console.log(
        "Creating Polar checkout for product:",
        productId,
        "subscription:",
        subscription
      );
      const { data } = await axios.post(
        `/api/payments/create-checkout-session`,
        {
          userId: user?.id,
          email: user?.emailAddresses?.[0]?.emailAddress,
          productId,
          subscription,
        }
      );

      if (data.checkoutUrl) {
        // Redirect directly to Polar checkout URL
        window.location.href = data.checkoutUrl;
        return;
      } else {
        console.error("Failed to create checkout session");
        toast("Failed to create checkout session");
        return;
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast("Error during checkout");
      return;
    }
  };

  const plans = [
    {
      title: "Basic",
      monthlyPrice: 25,
      yearlyPrice: 250,
      description:
        "Perfect for small teams getting started with AI verification.",
      features: [
        "Up to 100 documents/month",
        "Basic workflow (Analyst → Manager)",
        "PDF, Word, TXT support",
        "Email support",
        "Basic audit trail",
        "Standard compliance checks",
      ],
      priceIdMonthly: process.env.NEXT_PUBLIC_POLAR_BASIC_PRODUCT_ID,
      priceIdYearly: process.env.NEXT_PUBLIC_POLAR_BASIC_PRODUCT_ID,
      actionLabel: "Get Started",
    },
    {
      title: "Pro",
      monthlyPrice: 100,
      yearlyPrice: 1000,
      description: "Advanced compliance features for growing enterprises.",
      features: [
        "Up to 500 documents/month",
        "Full workflow (Analyst → Compliance → Manager)",
        "Advanced compliance detection",
        "Priority support",
        "Custom rule configuration",
        "Advanced analytics & reporting",
        "API access",
      ],
      priceIdMonthly: process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID,
      priceIdYearly: process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID,
      actionLabel: "Go Professional",
      popular: true,
    },
    {
      title: "Enterprise",
      description: "Custom solutions for large-scale operations.",
      features: [
        "Unlimited documents",
        "Custom integrations (Slack, M365, etc.)",
        "Dedicated support & training",
        "Custom compliance frameworks",
        "SLA guarantees (99.9% uptime)",
        "White-label options",
        "On-premise deployment",
      ],
      actionLabel: "Contact Sales",
      priceIdMonthly: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID,
      priceIdYearly: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID,
      exclusive: true,
    },
  ];

  return (
    <section className="px-4">
      <div className="max-w-7xl mx-auto">
        <PricingHeader
          title="Enterprise Document Analysis Plans"
          subtitle="Comprehensive hallucination detection with role-based workflows. Contact sales for custom enterprise pricing and volume discounts."
        />
        <PricingSwitch onSwitch={togglePricingPeriod} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-10"
        >
          {plans.map((plan) => (
            <PricingCard
              key={plan.title}
              user={user}
              handleCheckout={handleCheckout}
              {...plan}
              isYearly={isYearly}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
