"use client";

import dynamic from "next/dynamic";
import AppToaster from "@/components/AppToaster";

type RootClientEffectsProps = {
  installPromptLabels: {
    buttonInstall: string;
    buttonLater: string;
    description: string;
    title: string;
  };
  offlineBannerMessage: string;
};

const ToastMessenger = dynamic(() => import("@/components/ToastMessenger"), {
  ssr: false,
});
const ServiceWorkerRegistrar = dynamic(
  () => import("@/components/ServiceWorkerRegistrar"),
  { ssr: false },
);
const OfflineBanner = dynamic(() => import("@/components/OfflineBanner"), {
  ssr: false,
});
const InstallPrompt = dynamic(() => import("@/components/InstallPrompt"), {
  ssr: false,
});

export default function RootClientEffects({
  installPromptLabels,
  offlineBannerMessage,
}: RootClientEffectsProps) {
  return (
    <>
      <ToastMessenger />
      <AppToaster />
      <OfflineBanner message={offlineBannerMessage} />
      <InstallPrompt labels={installPromptLabels} />
      <ServiceWorkerRegistrar />
    </>
  );
}
