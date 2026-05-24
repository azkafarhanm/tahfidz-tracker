"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      closeButton
      duration={3600}
      position="top-center"
      richColors
      visibleToasts={1}
    />
  );
}
