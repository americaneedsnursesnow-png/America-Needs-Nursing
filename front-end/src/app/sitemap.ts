import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://americaneedsnurses.com";

  // Define your static routes here
  const routes = [
    "",
    "/jobs",
    "/jobs/locations",
    "/companies",
    "/blog",
    "/about-us",
    "/contact-us",
    "/privacy-policy",
    "/terms-and-conditions",
    "/sign-in",
    "/register",
    "/community",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}
