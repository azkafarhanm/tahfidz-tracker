"use client";

import { useEffect } from "react";

export default function ScrollDebugProbe() {
  useEffect(() => {
    let lastY = window.scrollY;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList" || m.type === "attributes") {
          console.log("[scroll-debug-probe] DOM mutation:", {
            type: m.type,
            target: (m.target as Element).tagName,
            attributeName: m.attributeName,
            addedNodes: m.addedNodes.length,
            removedNodes: m.removedNodes.length,
            scrollY: window.scrollY,
            delta: window.scrollY - lastY,
          });
          lastY = window.scrollY;
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-highlight-active", "data-highlight", "style", "class"],
    });

    const onScroll = () => {
      const delta = window.scrollY - lastY;
      if (Math.abs(delta) > 5) {
        console.log("[scroll-debug-probe] SCROLL EVENT jump:", delta, "from:", lastY, "to:", window.scrollY);
        console.trace("[scroll-debug-probe] scroll stack trace");
      }
      lastY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
