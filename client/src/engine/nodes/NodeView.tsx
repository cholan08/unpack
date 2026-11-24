import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, memo } from 'react';
import { CodeLines } from '@/lib/highlight';
import { ICONS } from '../icons';
import type { Placed } from '../useSceneTween';
import type { DocNode, Field, Item, NodeSpec, ScreenLine, Tone } from '../types';

const DEFAULT_TONE: Partial<Record<NodeSpec['kind'], Tone>> = {
  browser: 'client',
  db: 'data',
  doc: 'data',
};

const spring = { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 } as const;

function Icon({ name, size = 18 }: { name?: NodeSpec['icon']; size?: number }) {
  if (!name) return null;
  const C = ICONS[name];
  return <C size={size} strokeWidth={2} aria-hidden />;
}

function Box({ n }: { n: NodeSpec }) {
  return (
    <div className="node-card box">
      {n.icon && (
        <span className="node-icon">
          <Icon name={n.icon} />
        </span>
      )}
      <span className="node-text">
        {n.label && <span className="node-label">{n.label}</span>}
        {n.sub && <span className="node-sub">{n.sub}</span>}
      </span>
    </div>
  );
}

function ScreenView({ lines }: { lines: ScreenLine[] }) {
  return (
    <div className="screen">
      {lines.map((l, i) => {
        switch (l.t) {
          case 'h':
            return <div key={i} className="scr-h">{l.text}</div>;
          case 'text':
            return <div key={i} className="scr-text">{l.text}</div>;
          case 'btn':
            return <div key={i} className="scr-btn" data-state={l.state}>{l.text}</div>;
          case 'input':
            return <div key={i} className="scr-input" data-placeholder={l.placeholder || undefined}>{l.text}</div>;
          case 'item':
            return (
              <div key={`${i}-${l.text}`} className="scr-item" data-done={l.done || undefined} data-flash={l.flash || undefined}>
                <i />
                {l.text}
              </div>
            );
          case 'skeleton':
            return (
              <div key={i} className="scr-skel">
                {Array.from({ length: l.n ?? 3 }, (_, j) => <i key={j} style={{ width: `${88 - j * 17}%` }} />)}
              </div>
            );
          case 'spinner':
            return <div key={i} className="scr-spin"><i />{l.text ?? 'Loading…'}</div>;
          case 'error':
            return <div key={i} className="scr-msg scr-msg--err">{l.text}</div>;
          case 'ok':
            return <div key={i} className="scr-msg scr-msg--ok">{l.text}</div>;
        }
      })}
    </div>
  );
}

function Browser({ n }: { n: Extract<NodeSpec, { kind: 'browser' }> }) {
  return (
    <div className="node-card browser">
      <div className="browser-bar">
        <span className="browser-dots"><i /><i /><i /></span>
        <span className="browser-url">{n.url ?? 'localhost:5173'}</span>
      </div>
      <div className="browser-body">
        {n.screen ? (
          <ScreenView lines={n.screen} />
        ) : (
          <div className="browser-empty">
            <Icon name={n.icon ?? 'browser'} size={22} />
            {n.sub && <span>{n.sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function Db({ n, w, h }: { n: Extract<NodeSpec, { kind: 'db' }>; w: number; h: number }) {
  const ry = Math.min(15, h * 0.14);
  const body = `M1,${ry} A${w / 2 - 1},${ry} 0 0 1 ${w - 1},${ry} V${h - ry} A${w / 2 - 1},${ry} 0 0 1 1,${h - ry} Z`;
  const lid = `M1,${ry} A${w / 2 - 1},${ry} 0 0 0 ${w - 1},${ry}`;
  return (
    <div className="db">
      <svg className="db-shape" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
        <path className="db-body" d={body} />
        <path className="db-lid" d={lid} />
        <ellipse className="db-top" cx={w / 2} cy={ry} rx={w / 2 - 1} ry={ry} />
      </svg>
      <div className="db-content" style={{ paddingTop: ry * 2 + 2 }}>
        <span className="db-title">
          <Icon name={n.icon ?? 'db'} size={15} />
          {n.label}
        </span>
        {n.sub && <span className="node-sub">{n.sub}</span>}
        {n.items && (
          <span className="db-items">
            {n.items.map((it) => <span key={it}>{it}</span>)}
          </span>
        )}
      </div>
    </div>
  );
}

function Actor({ n }: { n: NodeSpec }) {
  return (
    <div className="actor">
      <span className="actor-avatar">
        <Icon name={n.icon ?? 'user'} size={24} />
      </span>
      {n.label && <span className="node-label">{n.label}</span>}
      {n.sub && <span className="node-sub">{n.sub}</span>}
    </div>
  );
}

const ItemRow = forwardRef<HTMLDivElement, { it: Item; axis: 'y' | 'x'; mono?: boolean }>(function ItemRow({ it, axis, mono }, ref) {
  return (
    <motion.div
      ref={ref}
      layout
      className={`list-item${mono ? ' is-mono' : ''}`}
      data-tone={it.tone}
      data-state={it.state}
      initial={axis === 'y' ? { opacity: 0, y: -16, scale: 0.96 } : { opacity: 0, x: 22, scale: 0.96 }}
      // opacity is animated (not left to CSS) because motion's inline style would override a stylesheet rule
      animate={{ opacity: it.state === 'dim' ? 0.42 : 1, x: 0, y: 0, scale: 1 }}
      exit={axis === 'y' ? { opacity: 0, x: 30, transition: { duration: 0.22 } } : { opacity: 0, y: -18, transition: { duration: 0.22 } }}
      transition={spring}
    >
      <span className="list-text">{it.text}</span>
      {it.sub && <span className="list-sub">{it.sub}</span>}
    </motion.div>
  );
});

function List({ n, axis }: { n: Extract<NodeSpec, { kind: 'stack' | 'queue' }>; axis: 'y' | 'x' }) {
  return (
    <div className={`node-card list list--${axis}`} data-from={n.kind === 'stack' ? (n.from ?? 'bottom') : undefined}>
      <div className="list-head">
        <Icon name={n.icon} size={14} />
        <span className="list-title">{n.label}</span>
        {n.sub && <span className="list-hint">{n.sub}</span>}
      </div>
      <div className="list-body">
        <AnimatePresence initial={false} mode="popLayout">
          {n.items.map((it) => <ItemRow key={it.id} it={it} axis={axis} mono={n.mono} />)}
        </AnimatePresence>
        {n.items.length === 0 && n.empty && <div className="list-empty">{n.empty}</div>}
      </div>
    </div>
  );
}

function Code({ n }: { n: Extract<NodeSpec, { kind: 'code' }> }) {
  return (
    <div className="node-card codecard">
      <div className="codecard-tab">
        <Icon name={n.icon ?? 'file'} size={13} />
        <span>{n.file ?? n.label ?? 'code'}</span>
      </div>
      <pre className="codecard-body">
        <CodeLines code={n.code} lang={n.lang} hl={n.hl} err={n.err} numbers={false} />
      </pre>
    </div>
  );
}

const valueClass = (v: string) =>
  /^["']/.test(v) ? 'tok-str' : /^-?\d/.test(v) ? 'tok-num' : /^(true|false|null)$/.test(v) ? 'tok-kw' : /^[A-Z]\w*\(/.test(v) ? 'tok-fn' : 'tok-plain';

function FieldRow({ f }: { f: Field }) {
  return (
    <div className="doc-field" data-hl={f.hl || undefined} data-tone={f.tone} style={{ paddingLeft: 14 + (f.indent ?? 0) * 14 }}>
      {f.k && <span className="doc-k">{f.k}</span>}
      {f.k && <span className="doc-colon">: </span>}
      <span className={valueClass(f.v)}>{f.v}</span>
    </div>
  );
}

function Doc({ n }: { n: DocNode }) {
  return (
    <div className="node-card doc">
      <div className="doc-head">
        <Icon name={n.icon ?? 'json'} size={13} />
        <span>{n.label ?? 'document'}</span>
        {n.sub && <span className="doc-sub">{n.sub}</span>}
      </div>
      <div className="doc-body">
        <div className="doc-brace">{'{'}</div>
        {n.fields.map((f, i) => <FieldRow key={`${f.k}-${i}`} f={f} />)}
        <div className="doc-brace">{'}'}</div>
      </div>
    </div>
  );
}

function Chip({ n }: { n: NodeSpec }) {
  return (
    <div className="chip">
      <Icon name={n.icon} size={14} />
      <span>{n.label}</span>
    </div>
  );
}

function Zone({ n }: { n: NodeSpec }) {
  return (
    <div className="zone">
      <span className="zone-label">
        <Icon name={n.icon} size={13} />
        {n.label}
      </span>
      {n.sub && <span className="zone-sub">{n.sub}</span>}
    </div>
  );
}

function Content({ n, w, h }: { n: NodeSpec; w: number; h: number }) {
  switch (n.kind) {
    case 'box':
      return <Box n={n} />;
    case 'browser':
      return <Browser n={n} />;
    case 'db':
      return <Db n={n} w={w} h={h} />;
    case 'actor':
      return <Actor n={n} />;
    case 'stack':
      return <List n={n} axis="y" />;
    case 'queue':
      return <List n={n} axis="x" />;
    case 'code':
      return <Code n={n} />;
    case 'doc':
      return <Doc n={n} />;
    case 'chip':
      return <Chip n={n} />;
    case 'dot':
      return (
        <div className="dot">
          <Icon name={n.icon} size={14} />
        </div>
      );
    case 'zone':
      return <Zone n={n} />;
    case 'note':
      return <div className="note" style={{ textAlign: n.align ?? 'center' }}>{n.text}</div>;
  }
}

const meterLevel = (m: number) => (m >= 0.85 ? 'hot' : m >= 0.6 ? 'warm' : 'ok');

export const NodeView = memo(function NodeView({ p }: { p: Placed }) {
  const { spec: n, rect } = p;
  const tone = n.tone ?? DEFAULT_TONE[n.kind] ?? 'neutral';
  const ringed = n.kind !== 'zone' && n.kind !== 'note';
  const caption = n.kind === 'browser' && n.label;
  return (
    <div
      className={`node node--${n.kind}`}
      data-node={p.id}
      data-tone={tone}
      data-state={n.state ?? 'idle'}
      style={{
        left: rect.x - rect.w / 2,
        top: rect.y - rect.h / 2,
        width: rect.w,
        height: rect.h,
        opacity: p.opacity,
        transform: p.scale === 1 ? undefined : `scale(${p.scale})`,
        zIndex: n.kind === 'zone' ? 0 : 2 + (n.z ?? 0),
      }}
    >
      {ringed && <span className="node-ring" />}
      <Content n={n} w={rect.w} h={rect.h} />
      {caption && (
        <span className="node-caption">
          {n.icon && <Icon name={n.icon} size={13} />}
          {n.label}
        </span>
      )}
      {n.kind === 'dot' && (n.label || n.sub) && (
        <span className="dot-caption" data-pos={n.caption ?? 'below'}>
          {n.label && <span className="dot-label">{n.label}</span>}
          {n.sub && <span className="dot-sub">{n.sub}</span>}
        </span>
      )}
      {n.meter !== undefined && (
        <span className="node-meter" data-level={meterLevel(n.meter)}>
          <i style={{ width: `${Math.round(Math.min(1, n.meter) * 100)}%` }} />
        </span>
      )}
      {n.badge && (
        <span className="node-badge" data-tone={n.badge.tone ?? tone}>
          {n.badge.text}
        </span>
      )}
    </div>
  );
});
