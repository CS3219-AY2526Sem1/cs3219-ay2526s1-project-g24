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
          { key: "Content-Security-Policy", value: "upgrade-insecure-requests" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
