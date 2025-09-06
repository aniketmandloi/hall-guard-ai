import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/sign-in/",
          "/sign-up/",
          "/user-profile/",
          "/admin/",
          "/workflow/",
          "/analysis/",
          "/audit/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/sign-in/",
          "/sign-up/",
          "/user-profile/",
          "/admin/",
          "/workflow/",
          "/analysis/",
          "/audit/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/sign-in/",
          "/sign-up/",
          "/user-profile/",
          "/admin/",
          "/workflow/",
          "/analysis/",
          "/audit/",
        ],
      },
    ],
    sitemap: "https://hallguardai.com/sitemap.xml",
    host: "https://hallguardai.com",
  };
}
