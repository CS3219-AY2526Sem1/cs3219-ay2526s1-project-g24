/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: "standalone",
  outputFileTracingRoot: require("path").join(__dirname, "../../"),
};

module.exports = nextConfig;
