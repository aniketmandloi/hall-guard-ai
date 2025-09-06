import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://hallguardai.com"),
  title: "Hall Guard AI - Enterprise Hallucination Detection Platform",
  description:
    "Enterprise-grade AI verification platform that detects factual errors, logical inconsistencies, and compliance violations in AI-generated content. Trusted by legal, financial, and healthcare organizations for critical document verification and risk assessment.",
  keywords: [
    "hallucination detection",
    "AI verification platform",
    "enterprise fact checking",
    "compliance validation software",
    "document analysis AI",
    "multi-AI consensus",
    "role-based workflow",
    "SOX compliance checking",
    "GDPR compliance validation",
    "HIPAA document verification",
    "enterprise AI audit",
    "content verification platform",
    "AI risk assessment",
    "regulatory compliance software",
    "enterprise document processing",
    "AI content validation",
  ],
  openGraph: {
    title: "Hall Guard AI - Enterprise Hallucination Detection Platform",
    description:
      "Detect factual errors, logical inconsistencies, and compliance violations in AI-generated content with our enterprise-grade verification platform. Multi-AI consensus, role-based workflows, and comprehensive audit trails for regulated industries.",
    type: "website",
    locale: "en_US",
    siteName: "Hall Guard AI",
    images: [
      {
        url: "https://hallguardai.com/marketing-og-image.png",
        width: 1200,
        height: 630,
        alt: "Hall Guard AI Enterprise Hallucination Detection Dashboard",
      },
    ],
    url: "https://hallguardai.com/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hall Guard AI - Enterprise AI Verification",
    description:
      "Enterprise hallucination detection platform for legal, financial, and healthcare organizations. Multi-AI consensus with role-based workflow management.",
    site: "@HallGuardAI",
    creator: "@HallGuardAI",
    images: [
      {
        url: "https://hallguardai.com/marketing-twitter-image.png",
        width: 1200,
        height: 630,
        alt: "Hall Guard AI - Enterprise Hallucination Detection Platform",
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
  classification: "Business Software",
  authors: [{ name: "Hall Guard AI Team" }],
  creator: "Hall Guard AI",
  publisher: "Hall Guard AI",
  applicationName: "Hall Guard AI",
};
