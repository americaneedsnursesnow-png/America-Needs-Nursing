import type { NextConfig } from "next";

/** Nest ann-backend (HTTP + Socket.IO). Used by /api/nest rewrites. */
const API_UPSTREAM =
  process.env.API_UPSTREAM_URL?.replace(/\/$/, "") || "http://127.0.0.1:3001";

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
    /**
     * Self-hosted (VPS + nginx): `next/image` normally hits `/_next/image`, which must be
     * proxied to this Node process. If that route is missing or blocked, all public-folder
     * images break. `unoptimized` serves `/hero/...`, `/logo/...` etc. as plain URLs instead.
     * Remove this (and proxy `/_next/image` to Next) when you want the built-in optimizer.
     */
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
