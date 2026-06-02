import type { NextConfig } from "next";

// Extract the Supabase hostname dynamically to avoid hardcoding infra details in CSP
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : "";

// Allowed origins for Server Actions (dev + production)
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const allowedOrigins = [
  "localhost:3000",
  ...(appUrl !== "http://localhost:3000"
    ? [new URL(appUrl).host]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
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
      ...(supabaseHostname ? [supabaseHostname] : []),
    ].join(" ");

    const connectSrc = [
      "'self'",
      "ws:",
      "wss:",
      ...(supabaseHostname
        ? [`https://${supabaseHostname}`, `wss://${supabaseHostname}`]
        : ["http:", "https:"]),
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
              "style-src 'self' 'unsafe-inline';",
              `img-src ${imgSrc};`,
              `connect-src ${connectSrc};`,
              "font-src 'self' data:;",
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
