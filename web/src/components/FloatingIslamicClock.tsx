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
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    setPos(loadPos());
  }, []);

  const clampToBounds = useCallback((x: number, y: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: clamp(x, SIDEBAR_W + PAD, vw - CLOCK_W - PAD),
      y: clamp(y, PAD, vh - CLOCK_H - PAD),
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;

    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      e.preventDefault();
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const next = clampToBounds(dragRef.current.origX + dx, dragRef.current.origY + dy);
      setPos(next);
    }

    function onUp() {
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

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
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

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    setDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
  }, [pos]);

  const onDoubleClick = useCallback(() => {
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
        className={`w-36 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        role="button"
        tabIndex={-1}
        aria-label="Draggable Islamic clock"
      >
        <SidebarIslamicClock />
      </div>
    </div>
  );
}
