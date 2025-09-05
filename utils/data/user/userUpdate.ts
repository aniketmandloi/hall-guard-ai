"server only";
import { prisma } from "@/prisma/db";
import { userUpdateProps } from "@/utils/types";

export const userUpdate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userUpdateProps) => {
  try {
    const result = await prisma.user.update({
      where: {
        userId: user_id,
      },
      data: {
        email,
        firstName: first_name,
        lastName: last_name,
        profileImageUrl: profile_image_url,
      },
    });

    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
