"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import SidebarIslamicClock from "@/components/SidebarIslamicClock";

const STORAGE_KEY = "tahfidzflow-clock-pos";
const DEFAULT_X = 300;
const DEFAULT_Y = 120;
const SIDEBAR_W = 256;
const CLOCK_W = 144;
const CLOCK_H = 220;
const PAD = 16;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function loadPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { x: DEFAULT_X, y: DEFAULT_Y };
    const p = JSON.parse(raw);
    if (typeof p.x === "number" && typeof p.y === "number") return p;
  } catch {}
  return { x: DEFAULT_X, y: DEFAULT_Y };
}

function savePos(x: number, y: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {}
}

export default function FloatingIslamicClock() {
  const [pos, setPos] = useState({ x: DEFAULT_X, y: DEFAULT_Y });
  const [mounted, setMounted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    origX: number;
    origY: number;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);

  const clampToBounds = useCallback((x: number, y: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: clamp(x, SIDEBAR_W + PAD, vw - CLOCK_W - PAD),
      y: clamp(y, PAD, vh - CLOCK_H - PAD),
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = loadPos();
    setPos(clampToBounds(saved.x, saved.y));
  }, [clampToBounds]);

  useEffect(() => {
    if (!mounted) return;

    function endDrag() {
      if (!dragRef.current) return;
      dragRef.current = null;
      setDragging(false);
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      setPos((p) => {
        savePos(p.x, p.y);
        return p;
      });
    }

    function onMove(e: PointerEvent) {
      if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;
      e.preventDefault();
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const next = clampToBounds(dragRef.current.origX + dx, dragRef.current.origY + dy);
      setPos(next);
    }

    function onUp(e: PointerEvent) {
      if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;
      endDrag();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", endDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", endDrag);
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [mounted, clampToBounds]);

  useEffect(() => {
    if (!mounted) return;

    function onResize() {
      setPos((current) => {
        const next = clampToBounds(current.x, current.y);
        savePos(next.x, next.y);
        return next;
      });
    }

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [mounted, clampToBounds]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    setDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
  }, [pos]);

  const resetPosition = useCallback(() => {
    const next = clampToBounds(DEFAULT_X, DEFAULT_Y);
    setPos(next);
    savePos(next.x, next.y);
  }, [clampToBounds]);

  if (!mounted) return null;

  return (
    <div
      className="fixed z-10 hidden xl:block"
      style={{ top: pos.y, insetInlineStart: pos.x }}
    >
      <div
        className={`w-36 touch-none select-none rounded-2xl transition-shadow ${dragging ? "cursor-grabbing shadow-lg shadow-slate-900/10" : "cursor-grab"}`}
        onDoubleClick={resetPosition}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            resetPosition();
          }
        }}
        onPointerDown={onPointerDown}
        role="button"
        tabIndex={0}
        aria-label="Draggable Islamic clock"
      >
        <SidebarIslamicClock />
      </div>
    </div>
  );
}
