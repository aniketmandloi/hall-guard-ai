"use client";
import PageWrapper from "@/components/wrapper/page-wrapper";
import config from "@/config";
// import { UserProfile } from "@clerk/nextjs";
import { UserProfile } from "@/components/auth/user-profile";
import { useRouter } from "next/navigation";

const UserProfilePage = () => {
  const router = useRouter();

  if (!config?.auth?.enabled) {
    router.back();
  }
  return (
    <PageWrapper>
      {/* clerk component */}
      {/* <div className="h-full flex items-center justify-center p-9">
        {config?.auth?.enabled && (
          <UserProfile path="/user-profile" routing="path" />
        )}
      </div> */}

      {/* custom component */}
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <UserProfile />
      </div>
    </PageWrapper>
  );
};

export default UserProfilePage;
