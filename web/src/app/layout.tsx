import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Amiri } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import ScopedIntlProvider from "@/components/ScopedIntlProvider";
import ThemeProvider from "@/components/ThemeProvider";
import RootClientEffects from "@/components/RootClientEffects";
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
  const [offlineT, installT] = await Promise.all([
    getTranslations("Offline"),
    getTranslations("InstallPrompt"),
  ]);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${geistSans.variable} ${amiri.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ScopedIntlProvider namespaces={["Error", "LogoutButton"]}>
            {children}
            <RootClientEffects
              installPromptLabels={{
                buttonInstall: installT("buttonInstall"),
                buttonLater: installT("buttonLater"),
                description: installT("description"),
                title: installT("title"),
              }}
              offlineBannerMessage={offlineT("banner")}
            />
          </ScopedIntlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
