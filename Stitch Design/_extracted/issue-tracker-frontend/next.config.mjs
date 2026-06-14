/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep server-only packages out of the client bundle (Next 15: top-level key).
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
