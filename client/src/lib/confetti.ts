/**
 * A short burst of paper confetti in the role colours (client blue, server orange, data green…),
 * drawn on a throwaway canvas that removes itself. Used the first time a lesson is finished.
 * Does nothing when the OS asks for less motion.
 */
const COLOR_TOKENS = ['--client', '--server', '--data', '--net', '--auth', '--ai', '--warn'];

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  flip: number;
  vf: number;
  color: string;
  round: boolean;
}

export function confetti(origin: { x: number; y: number }, { count = 120, spread = 62, power = 1 } = {}) {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const css = getComputedStyle(document.documentElement);
  const colors = COLOR_TOKENS.map((t) => css.getPropertyValue(t).trim()).filter(Boolean);
  if (!colors.length) colors.push('#2563eb', '#c9610a', '#13803b');

  const W = window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: `${W}px`, height: `${H}px`, pointerEvents: 'none', zIndex: '450' });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);

  const arc = (spread * Math.PI) / 180;
  const bits: Bit[] = Array.from({ length: count }, () => {
    const a = -Math.PI / 2 + (Math.random() * 2 - 1) * arc; // upwards, fanned out
    const v = (6.5 + Math.random() * 8.5) * power; // px per 60fps frame
    return {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      w: 6 + Math.random() * 6,
      h: 3.5 + Math.random() * 4.5,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.34,
      flip: Math.random() * Math.PI * 2,
      vf: 0.07 + Math.random() * 0.12,
      color: colors[Math.floor(Math.random() * colors.length)],
      round: Math.random() < 0.22,
    };
  });

  const LIFE = 2600;
  const start = performance.now();
  let last = start;
  const frame = (now: number) => {
    const dt = Math.min(2.5, (now - last) / 16.667); // frames elapsed, so speed is the same at 60 or 120 Hz
    last = now;
    const t = now - start;
    const alpha = t > LIFE - 650 ? Math.max(0, (LIFE - t) / 650) : 1;
    const drag = Math.pow(0.986, dt);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = alpha;
    for (const b of bits) {
      b.vx *= drag;
      b.vy = b.vy * drag + 0.3 * dt; // gravity
      b.x += b.vx * dt + Math.sin(b.flip) * 0.4; // a little flutter
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      b.flip += b.vf * dt;
      if (b.y > H + 24) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.scale(1, Math.cos(b.flip)); // paper turning over
      ctx.fillStyle = b.color;
      if (b.round) {
        ctx.beginPath();
        ctx.arc(0, 0, b.h * 0.75, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
    if (t < LIFE) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
