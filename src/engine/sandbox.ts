import type { Control, Sandbox, Scene, Step, Values } from './types';

export const defaultValues = (sb: Sandbox): Values => Object.fromEntries(sb.controls.map((c) => [c.id, c.value]));

/** The scene a step shows (for a sandbox step: with these values, or its defaults). */
export function stepScene(step: Step, values?: Values): Scene {
  return step.sandbox ? step.sandbox.compute(values ?? defaultValues(step.sandbox)).scene : step.scene;
}

/** Every scene a step can show — defaults plus each control at its extremes / each option.
 *  Used to frame the camera and to build the legend, so nothing falls outside the view. */
export function stepScenes(step: Step): Scene[] {
  if (!step.sandbox) return [step.scene];
  const sb = step.sandbox;
  const d = defaultValues(sb);
  const variants: Values[] = [d];
  for (const c of sb.controls) {
    if (c.kind === 'range') variants.push({ ...d, [c.id]: c.min }, { ...d, [c.id]: c.max });
    else if (c.kind === 'toggle') variants.push({ ...d, [c.id]: !c.value });
    else c.options.forEach((o) => variants.push({ ...d, [c.id]: o.value }));
  }
  return variants.map((v) => sb.compute(v).scene);
}

/* ---------------- log sliders: the input runs 0…1000, values grow exponentially ---------------- */
const SPAN = 1000;
const nice = (v: number) => {
  if (v < 10) return Math.round(v);
  const p = Math.pow(10, Math.floor(Math.log10(v)) - 1); // keep two significant digits
  return Math.round(v / p) * p;
};
export function toSlider(c: Extract<Control, { kind: 'range' }>, v: number): number {
  if (!c.log) return v;
  return Math.round((Math.log(v / c.min) / Math.log(c.max / c.min)) * SPAN);
}
export function fromSlider(c: Extract<Control, { kind: 'range' }>, pos: number): number {
  if (!c.log) return pos;
  return Math.min(c.max, Math.max(c.min, nice(c.min * Math.pow(c.max / c.min, pos / SPAN))));
}
export const sliderSpan = SPAN;

export function formatControl(c: Extract<Control, { kind: 'range' }>, v: number): string {
  if (c.format) return c.format(v);
  return `${v.toLocaleString('en-US')}${c.unit ? ` ${c.unit}` : ''}`;
}
