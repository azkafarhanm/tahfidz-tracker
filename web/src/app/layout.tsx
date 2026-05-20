import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Amiri } from "next/font/google";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import ThemeProvider from "@/components/ThemeProvider";
import ToastMessenger from "@/components/ToastMessenger";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import OfflineBanner from "@/components/OfflineBanner";
import AppToaster from "@/components/AppToaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: "400",
  subsets: ["arabic"],
});

const InstallPrompt = dynamic(() => import("@/components/InstallPrompt"));

export const metadata: Metadata = {
  title: "TahfidzFlow",
  description: "Mobile-first hafalan and murojaah management for teachers.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TahfidzFlow",
  },
  openGraph: {
    title: "TahfidzFlow",
    description: "Mobile-first hafalan and murojaah management for teachers.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${geistSans.variable} ${amiri.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Suspense>
              <ToastMessenger />
            </Suspense>
            <AppToaster />
            <OfflineBanner />
            <InstallPrompt />
            <ServiceWorkerRegistrar />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
