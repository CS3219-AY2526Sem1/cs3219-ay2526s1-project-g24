/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: "standalone",
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          // Enforce HTTPS for any accidental http asset or API references
          { key: "Content-Security-Policy", value: "upgrade-insecure-requests" },
          // Strong transport security (browsers will stick to HTTPS)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Sensible security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
