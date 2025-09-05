import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import config from "@/config";

interface AuthWrapperProps {
  children: ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  if (!config.auth.enabled) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider 
      dynamic
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-none"
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
};

export default AuthWrapper;
