"use client";
import PageWrapper from "@/components/wrapper/page-wrapper";
import config from "@/config";
// import { SignUp } from "@clerk/nextjs";
import { SignUp } from "@/components/auth/sign-up";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  if (!config?.auth?.enabled) {
    router.back();
  }

  return (
    <PageWrapper>
      {/* clerk component */}
      {/* <div className="flex min-w-screen justify-center my-[5rem]">
        <SignUp
          fallbackRedirectUrl="/"
          signInFallbackRedirectUrl="/dashboard"
        />
      </div> */}

      {/* custom component */}
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <SignUp />
      </div>
    </PageWrapper>
  );
}
