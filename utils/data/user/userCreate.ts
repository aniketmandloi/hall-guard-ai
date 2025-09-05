"server only";

import { prisma } from "@/prisma/db";
import { userCreateProps } from "@/utils/types";

export const userCreate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userCreateProps) => {
  try {
    console.log("info", {
      email,
      firstName: first_name,
      lastName: last_name,
      profileImageUrl: profile_image_url,
      userId: user_id,
    });

    const result = await prisma.user.create({
      data: {
        email,
        firstName: first_name,
        lastName: last_name,
        profileImageUrl: profile_image_url,
        userId: user_id,
      },
    });

    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
