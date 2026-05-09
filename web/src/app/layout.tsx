import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Amiri } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import ThemeProvider from "@/components/ThemeProvider";
import ToastMessenger from "@/components/ToastMessenger";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic"],
});

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
    <html lang={locale} dir={dir} className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Suspense>
              <ToastMessenger />
            </Suspense>
            <Toaster position="top-center" richColors closeButton />
            <InstallPrompt />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
