"use client";

import { useEffect, useRef } from "react";

const surahNames = [
  "الفاتحة",
  "البقرة",
  "آل عمران",
  "النساء",
  "المائدة",
  "الأنعام",
  "الأعراف",
  "الأنفال",
  "التوبة",
  "يونس",
  "هود",
  "يوسف",
  "الرعد",
  "إبراهيم",
  "الحجر",
  "النحل",
  "الإسراء",
  "الكهف",
  "مريم",
  "طه",
  "الأنبياء",
  "الحج",
  "المؤمنون",
  "النور",
  "الفرقان",
  "الشعراء",
  "النمل",
  "القصص",
  "العنكبوت",
  "الروم",
  "لقمان",
  "السجدة",
  "الأحزاب",
  "سبأ",
  "فاطر",
  "يس",
  "الصافات",
  "ص",
  "الزمر",
  "غافر",
  "فصلت",
  "الشورى",
  "الزخرف",
  "الدخان",
  "الجاثية",
  "الأحقاف",
  "محمد",
  "الفتح",
  "الحجرات",
  "ق",
  "الذاريات",
  "الطور",
  "النجم",
  "القمر",
  "الرحمن",
  "الواقعة",
  "الحديد",
  "المجادلة",
  "الحشر",
  "الممتحنة",
  "الصف",
  "الجمعة",
  "المنافقون",
  "التغابن",
  "الطلاق",
  "التحريم",
  "الملك",
  "القلم",
  "الحاقة",
  "المعارج",
  "نوح",
  "الجن",
  "المزمل",
  "المدثر",
  "القيامة",
  "الإنسان",
  "المرسلات",
  "النبأ",
  "النازعات",
  "عبس",
  "التكوير",
  "الانفطار",
  "المطففين",
  "الانشقاق",
  "البروج",
  "الطارق",
  "الأعلى",
  "الغاشية",
  "الفجر",
  "البلد",
  "الشمس",
  "الليل",
  "الضحى",
  "الشرح",
  "التين",
  "العلق",
  "القدر",
  "البينة",
  "الزلزلة",
  "العاديات",
  "القارعة",
  "التكاثر",
  "العصر",
  "الهمزة",
  "الفيل",
  "قريش",
  "الماعون",
  "الكوثر",
  "الكافرون",
  "النصر",
  "المسد",
  "الإخلاص",
  "الفلق",
  "الناس",
] as const;

type Particle = {
  name: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  phase: number;
  drift: number;
};

export default function FloatingSurahs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nextNameIndexRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderingCanvas = canvas;
    const renderingCtx = ctx;

    function getWidth() {
      return renderingCanvas.offsetWidth;
    }

    function getHeight() {
      return renderingCanvas.offsetHeight;
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const width = getWidth();
      const height = getHeight();

      renderingCanvas.width = Math.floor(width * dpr);
      renderingCanvas.height = Math.floor(height * dpr);
      renderingCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function nextSurahName() {
      const name = surahNames[nextNameIndexRef.current % surahNames.length];
      nextNameIndexRef.current += 1;
      return name;
    }

    function spawn(fromBottom = true): Particle {
      return {
        name: nextSurahName(),
        x: Math.random() * getWidth(),
        y: fromBottom
          ? getHeight() + 40 + Math.random() * 120
          : Math.random() * getHeight(),
        speed: 0.22 + Math.random() * 0.4,
        size: 30 + Math.random() * 28,
        opacity: 0,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.24,
      };
    }

    resize();
    window.addEventListener("resize", resize);

    const particleCount = Math.min(
      34,
      Math.max(20, Math.round((getWidth() * getHeight()) / 42000)),
    );

    particlesRef.current = Array.from({ length: particleCount }, () =>
      spawn(false),
    ).map((particle) => ({
      ...particle,
      opacity: 0.16 + Math.random() * 0.1,
    }));

    let raf = 0;

    function draw() {
      const width = getWidth();
      const height = getHeight();
      const isDark = document.documentElement.classList.contains("dark");
      const fillColor = isDark ? "110, 231, 183" : "4, 120, 87";
      const strokeColor = isDark ? "15, 23, 42" : "236, 253, 245";
      const shadowColor = isDark ? "16, 185, 129" : "5, 150, 105";

      renderingCtx.clearRect(0, 0, width, height);

      for (const particle of particlesRef.current) {
        particle.y -= particle.speed;
        particle.phase += 0.012;
        particle.x += Math.sin(particle.phase) * 0.34 + particle.drift;

        const fadeIn = Math.min(1, (height - particle.y + 150) / 190);
        const fadeOut = Math.min(1, (particle.y + 80) / 150);
        const pulse = 0.84 + Math.sin(particle.phase * 0.6) * 0.16;
        const baseOpacity = isDark ? 0.34 : 0.24;

        particle.opacity = Math.max(0, fadeIn * fadeOut * baseOpacity * pulse);

        renderingCtx.save();
        renderingCtx.globalAlpha = particle.opacity;
        renderingCtx.textAlign = "center";
        renderingCtx.textBaseline = "middle";
        renderingCtx.font = `${particle.size}px var(--font-amiri, Amiri, serif)`;
        renderingCtx.lineWidth = Math.max(1, particle.size / 16);
        renderingCtx.strokeStyle = `rgba(${strokeColor}, ${isDark ? 0.42 : 0.78})`;
        renderingCtx.fillStyle = `rgba(${fillColor}, 1)`;
        renderingCtx.shadowColor = `rgba(${shadowColor}, ${isDark ? 0.4 : 0.22})`;
        renderingCtx.shadowBlur = isDark ? 18 : 14;
        renderingCtx.strokeText(particle.name, particle.x, particle.y);
        renderingCtx.fillText(particle.name, particle.x, particle.y);
        renderingCtx.restore();

        if (
          particle.y < -90 ||
          particle.x < -120 ||
          particle.x > width + 120
        ) {
          Object.assign(particle, spawn(true));
        }
      }

      raf = window.requestAnimationFrame(draw);
    }

    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
