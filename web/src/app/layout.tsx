import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
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

export const metadata: Metadata = {
  title: "TahfidzFlow",
  description: "Mobile-first hafalan and murojaah management for teachers.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <Suspense>
            <ToastMessenger />
          </Suspense>
          <Toaster position="top-center" richColors closeButton />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
