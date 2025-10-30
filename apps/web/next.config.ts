const nextConfig = {
  /* config options here */
  output: "standalone" as const,
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
  },
};

module.exports = nextConfig;
