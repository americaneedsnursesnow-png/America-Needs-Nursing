import type { NextConfig } from "next";

/** Nest ann-backend (HTTP + Socket.IO). Used by /api/nest rewrites. */
const API_UPSTREAM =
  process.env.API_UPSTREAM_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/dashboard/employee/notifications",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    // Only Engine.IO (Socket.IO). REST uses `app/api/nest/[...path]/route.ts` so `Authorization`
    // is forwarded reliably; fetch-based routes cannot upgrade WebSockets.
    return {
      beforeFiles: [
        {
          source: "/files/:path*",
          destination: `${API_UPSTREAM}/files/:path*`,
        },
        {
          source: "/api/nest/socket.io/:path*",
          destination: `${API_UPSTREAM}/socket.io/:path*`,
        },
      ],
    };
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
