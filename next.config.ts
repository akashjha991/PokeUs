import type { NextConfig } from "next";

// Allowed origins for Server Actions (dev + production)
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const allowedOrigins = [
  "localhost:3000",
  ...(appUrl !== "http://localhost:3000" ? [new URL(appUrl).host] : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins },
  },
  async headers() {
    const imgSrc = [
      "'self'",
      "data:",
      "res.cloudinary.com",
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      "img.clerk.com",
      "https://*.clerk.accounts.dev",
      "https://*.clerk.com",
    ].join(" ");

    const connectSrc = [
      "'self'",
      "ws:",
      "wss:",
      "https://*.clerk.accounts.dev",
      "https://clerk.com",
      "https://clerk-telemetry.com",
      "https://api.clerk.com",
    ].join(" ");

    const scriptSrc = [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      "blob:",
      "https://*.clerk.accounts.dev",
      "https://clerk.com",
      "https://*.clerk.com",
      "https://challenges.cloudflare.com",
    ].join(" ");

    const frameSrc = [
      "'self'",
      "https://*.clerk.accounts.dev",
      "https://clerk.com",
      "https://*.clerk.com",
      "https://challenges.cloudflare.com",
    ].join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              `script-src ${scriptSrc};`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              `img-src ${imgSrc};`,
              `connect-src ${connectSrc};`,
              `frame-src ${frameSrc};`,
              "font-src 'self' data: https://fonts.gstatic.com;",
              "worker-src 'self' blob:;",
              "object-src 'none';",
              "base-uri 'self';",
              "form-action 'self';",
              "frame-ancestors 'none';",
              "upgrade-insecure-requests;",
            ].join(" "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
