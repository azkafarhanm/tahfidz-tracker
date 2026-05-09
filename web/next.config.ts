import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
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

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
