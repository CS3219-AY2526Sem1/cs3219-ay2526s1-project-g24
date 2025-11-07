import path from "path";

const nextConfig = {
  /* config options here */
  output: "standalone" as const,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  async headers() {
    const securityHeaders = [
      // Strong transport security (browsers will stick to HTTPS)
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      // Sensible security headers
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];

    if (process.env.FORCE_HTTPS === "true") {
      // Only upgrade requests when we know the deployment sits behind HTTPS
      securityHeaders.unshift({ key: "Content-Security-Policy", value: "upgrade-insecure-requests" });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
