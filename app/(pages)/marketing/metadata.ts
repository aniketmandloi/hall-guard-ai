import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.com"),
  title: "Your Product Name",
  description: "Your product description",
  openGraph: {
    title: "Your Product Name",
    description: "Your product description",
    images: ["https://your-og-image.com"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Product Name",
    description: "Your product description",
    creator: "@yourhandle",
    images: ["https://your-og-image.com"],
  },
};
