import path from "path";

const nextConfig = {
  /* config options here */
  output: "standalone" as const,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Security headers for production
          // Note: Removed upgrade-insecure-requests to allow axios client to work properly
          // The axios client handles HTTP/HTTPS appropriately
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'", // Prevent clickjacking
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
