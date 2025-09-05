"server only";

import config from "@/config";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/prisma/db";

export const isAuthorized = async (
  userId: string
): Promise<{ authorized: boolean; message: string }> => {
  console.log("GET HIT");
  if (!config?.payments?.enabled) {
    console.log("Payments are disabled");
    return {
      authorized: true,
      message: "Payments are disabled",
    };
  }

  const result = (await clerkClient()).users.getUser(userId);

  if (!result) {
    return {
      authorized: false,
      message: "User not found",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        userId: userId,
      },
    });

    if (user?.subscription) {
      return {
        authorized: true,
        message: "User is authorized",
      };
    }

    return {
      authorized: false,
      message: "User is not subscribed",
    };
  } catch (error: any) {
    return {
      authorized: false,
      message: error.message,
    };
  }
};
