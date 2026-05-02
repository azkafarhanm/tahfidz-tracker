import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Handle Prisma server-only modules
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
};

export default nextConfig;
