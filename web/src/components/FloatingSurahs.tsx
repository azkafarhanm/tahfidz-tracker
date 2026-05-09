"use client";

import { useEffect, useRef } from "react";

const surahNames = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة",
  "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر",
  "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان",
  "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر",
  "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية",
  "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن",
  "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق",
  "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة",
  "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج",
  "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين",
  "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل",
  "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس",
];

type Particle = {
  name: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  phase: number;
};

export default function FloatingSurahs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    function spawn(): Particle {
      return {
        name: surahNames[Math.floor(Math.random() * surahNames.length)],
        x: Math.random() * w(),
        y: h() + 30,
        speed: 0.15 + Math.random() * 0.35,
        size: 10 + Math.random() * 14,
        opacity: 0,
        phase: Math.random() * Math.PI * 2,
      };
    }

    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = spawn();
      p.y = Math.random() * h();
      p.opacity = 0.05 + Math.random() * 0.12;
      particlesRef.current.push(p);
    }

    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w(), h());

      const isDark = document.documentElement.classList.contains("dark");
      const baseColor = isDark ? "180, 220, 180" : "20, 80, 50";

      for (const p of particlesRef.current) {
        p.y -= p.speed;
        p.phase += 0.008;
        p.x += Math.sin(p.phase) * 0.3;

        const fadeIn = Math.min(1, (h() - p.y + 60) / 120);
        const fadeOut = Math.min(1, p.y / 80);
        p.opacity = fadeIn * fadeOut * (0.06 + 0.06 * Math.sin(p.phase * 0.7));

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px var(--font-amiri, Amiri, serif)`;
        ctx.fillStyle = `rgba(${baseColor}, 1)`;
        ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y);
        ctx.restore();

        if (p.y < -40) {
          Object.assign(p, spawn());
        }
      }

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
