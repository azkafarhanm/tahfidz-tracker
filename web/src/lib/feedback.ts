export function playNotificationSound(kind: "success" | "error") {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    return;
  }

  try {
    const ctx = new AudioContext();
    const notes =
      kind === "success"
        ? [
            { frequency: 523.25, start: 0, duration: 0.25, gain: 0.18, type: "sine" as const },
            { frequency: 659.25, start: 0.15, duration: 0.3, gain: 0.18, type: "sine" as const },
          ]
        : [
            { frequency: 440, start: 0, duration: 0.25, gain: 0.12, type: "triangle" as const },
            { frequency: 349.23, start: 0.15, duration: 0.25, gain: 0.12, type: "triangle" as const },
          ];

    for (const note of notes) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = note.type;
      oscillator.frequency.value = note.frequency;
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(note.gain, ctx.currentTime + note.start);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + note.start + note.duration,
      );
      oscillator.start(ctx.currentTime + note.start);
      oscillator.stop(ctx.currentTime + note.start + note.duration);
    }

    void ctx.close().catch(() => {});
  } catch {
    // ignore unsupported audio environments
  }
}
