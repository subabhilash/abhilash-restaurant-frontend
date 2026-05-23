/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // enables minimal Docker production image
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },
};

export default nextConfig;
