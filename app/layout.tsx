import Provider from "@/app/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import AuthWrapper from "@/components/wrapper/auth-wrapper";
import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hallguardai.com/"),
  title: {
    default: "Hall Guard AI - Enterprise Hallucination Detection Platform",
    template: `%s | Hall Guard AI`,
  },
  description:
    "Enterprise-grade AI verification platform that detects factual errors, logical inconsistencies, and compliance violations in AI-generated content. Trusted by legal, financial, and healthcare organizations for critical document verification.",
  keywords: [
    "hallucination detection",
    "AI verification",
    "fact checking",
    "compliance validation",
    "document analysis",
    "enterprise AI",
    "SOX compliance",
    "GDPR compliance",
    "HIPAA compliance",
    "risk assessment",
    "AI audit",
    "content verification",
  ],
  openGraph: {
    title: "Hall Guard AI - Enterprise Hallucination Detection Platform",
    description:
      "Enterprise-grade AI verification platform that detects factual errors, logical inconsistencies, and compliance violations in AI-generated content. Multi-AI consensus with role-based workflow management.",
    type: "website",
    locale: "en_US",
    siteName: "Hall Guard AI",
    images: [
      {
        url: "https://hallguardai.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hall Guard AI - Enterprise Hallucination Detection Platform",
      },
    ],
    url: "https://hallguardai.com/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hall Guard AI - Enterprise Hallucination Detection Platform",
    description:
      "Enterprise-grade AI verification platform for detecting factual errors, logical inconsistencies, and compliance violations in AI-generated content.",
    site: "@HallGuardAI",
    creator: "@HallGuardAI",
    images: [
      {
        url: "https://hallguardai.com/twitter-image.png",
        width: 1200,
        height: 630,
        alt: "Hall Guard AI - Enterprise Hallucination Detection",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Enterprise Software",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <html lang="en" suppressHydrationWarning>
        <body className={GeistSans.className}>
          <Provider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
              {/* Global CAPTCHA element for Clerk */}
              <div
                id="clerk-captcha"
                style={{
                  position: "fixed",
                  top: "-9999px",
                  left: "-9999px",
                  visibility: "hidden",
                  pointerEvents: "none",
                }}
                data-cl-theme="auto"
                data-cl-size="flexible"
                data-cl-language="auto"
              ></div>
            </ThemeProvider>
          </Provider>
          <Analytics />
        </body>
      </html>
    </AuthWrapper>
  );
}
