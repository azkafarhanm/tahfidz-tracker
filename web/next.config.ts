import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Handle Prisma server-only modules
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "prisma",
    "bcryptjs",
    "pdfkit",
    "fontkit",
    "linebreak",
  ],
};

export default nextConfig;
