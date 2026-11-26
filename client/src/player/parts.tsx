import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Check as CheckIcon, CircleCheckBig, Copy, Eye, Lightbulb, Sparkles, TriangleAlert, OctagonX, HelpCircle } from 'lucide-react';
import { CodeLines } from '@/lib/highlight';
import type { Block, Callout as CalloutT, Check as CheckT, CodeSpec, Lesson, MetricValue, PacketKind } from '@/engine/types';
import { Rich } from './RichText';
import { stepScenes } from '@/engine/sandbox';

/* ---------------- callout ---------------- */
const CALLOUT = {
  insight: { icon: Lightbulb, label: 'Insight', tone: 'net' },
  warn: { icon: TriangleAlert, label: 'Watch out', tone: 'warn' },
  tip: { icon: Sparkles, label: 'Tip', tone: 'client' },
  mistake: { icon: OctagonX, label: 'Common mistake', tone: 'danger' },
  picture: { icon: Eye, label: 'Picture it', tone: 'server' },
} as const;

export function Callout({ c }: { c: CalloutT }) {
  const m = CALLOUT[c.kind];
  const I = m.icon;
  return (
    <aside className="callout" data-tone={m.tone} data-kind={c.kind}>
      <I size={17} strokeWidth={2.2} aria-hidden />
      <div>
        <span className="callout-label">{m.label}</span>
        <p>
          <Rich text={c.text} />
        </p>
      </div>
    </aside>
  );
}

/* ---------------- code ---------------- */
const LANG_LABEL: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'React · JSX',
  ts: 'TypeScript',
  tsx: 'React · TSX',
  json: 'JSON',
  http: 'HTTP',
  bash: 'Terminal',
  sh: 'Terminal',
  markup: 'HTML',
  html: 'HTML',
  css: 'CSS',
  yaml: 'YAML',
  docker: 'Dockerfile',
  text: 'Text',
};

export function CodeBlock({ c }: { c: CodeSpec }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(c.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <figure className="codeblock">
      <figcaption>
        <span className="codeblock-file">{c.file ?? LANG_LABEL[c.lang ?? 'js'] ?? c.lang}</span>
        {c.file && <span className="codeblock-lang">{LANG_LABEL[c.lang ?? 'js'] ?? c.lang}</span>}
        <button className="codeblock-copy" onClick={copy} aria-label="Copy code">
          {copied ? <CheckIcon size={14} /> : <Copy size={14} />}
        </button>
      </figcaption>
      <pre>
        <CodeLines code={c.code} lang={c.lang} hl={c.hl} err={c.err} />
      </pre>
    </figure>
  );
}

/* ---------------- detail: the structured explanation ---------------- */
function DetailBlock({ b }: { b: Block }) {
  switch (b.kind) {
    case 'h':
      return (
        <h3 className="dt-h">
          <Rich text={b.text} />
        </h3>
      );
    case 'p':
      return (
        <p className="dt-p">
          <Rich text={b.text} />
        </p>
      );
    case 'ul':
    case 'ol': {
      const L = b.kind;
      return (
        <L className={`dt-${b.kind}`}>
          {b.items.map((t, i) => (
            <li key={i}>
              <Rich text={t} />
            </li>
          ))}
        </L>
      );
    }
    case 'walk':
      return (
        <ol className="dt-walk">
          {b.items.map(([ln, t], i) => (
            <li key={i}>
              <span className="dt-walk-ln">{ln}</span>
              <span>
                <Rich text={t} />
              </span>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div className="dt-table-wrap">
          <table className="dt-table">
            <thead>
              <tr>
                {b.head.map((c, i) => (
                  <th key={i}>
                    <Rich text={c} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>
                      <Rich text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'code':
      return <CodeBlock c={b.code} />;
    case 'callout':
      return <Callout c={b.callout} />;
    case 'keys':
      return (
        <aside className="dt-keys">
          <span className="eyebrow">Key takeaways</span>
          <ul>
            {b.items.map((t, i) => (
              <li key={i}>
                <CircleCheckBig size={15} aria-hidden />
                <span>
                  <Rich text={t} />
                </span>
              </li>
            ))}
          </ul>
        </aside>
      );
    case 'qa':
      return (
        <div className="dt-qa">
          {b.items.map((x, i) => (
            <details key={i}>
              <summary>
                <span className="dt-qa-n">Q{i + 1}</span>
                <span>
                  <Rich text={x.q} />
                </span>
              </summary>
              <p>
                <Rich text={x.a} />
              </p>
            </details>
          ))}
        </div>
      );
  }
}

export function Detail({ blocks }: { blocks: Block[] }) {
  return (
    <div className="detail">
      {blocks.map((b, i) => (
        <DetailBlock key={i} b={b} />
      ))}
    </div>
  );
}

/* ---------------- what changed ---------------- */
export function Changes({ lines }: { lines: string[] }) {
  return (
    <div className="changes">
      <span className="eyebrow">What changed</span>
      <ul>
        {lines.map((l, i) => {
          const sign = l[0];
          const kind = sign === '+' ? 'add' : sign === '~' ? 'mod' : sign === '-' || sign === '−' ? 'del' : 'mod';
          const text = '+~-−'.includes(sign) ? l.slice(1).trim() : l;
          return (
            <li key={i} data-kind={kind}>
              <span className="changes-sign">{kind === 'add' ? '+' : kind === 'del' ? '−' : '~'}</span>
              <Rich text={text} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- predict check ---------------- */
export function Check({ c }: { c: CheckT }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  return (
    <div className="check" data-done={done || undefined}>
      <div className="check-head">
        <HelpCircle size={16} aria-hidden />
        <span className="eyebrow">Predict</span>
      </div>
      <p className="check-q">
        <Rich text={c.q} />
      </p>
      <div className="check-opts" role="group">
        {c.options.map((o, i) => {
          const state = !done ? undefined : i === c.answer ? 'right' : i === picked ? 'wrong' : 'other';
          return (
            <button key={i} className="check-opt" data-state={state} disabled={done} onClick={() => setPicked(i)}>
              <span className="check-letter">{String.fromCharCode(65 + i)}</span>
              <Rich text={o} />
            </button>
          );
        })}
      </div>
      {done && (
        <p className="check-explain" data-right={picked === c.answer || undefined}>
          <strong>{picked === c.answer ? 'Exactly. ' : 'Not quite. '}</strong>
          <Rich text={c.explain} />
        </p>
      )}
    </div>
  );
}

/* ---------------- metrics ---------------- */
const fmt = (v: MetricValue, unit?: string) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') {
    const s = Math.abs(v) >= 1000 ? v.toLocaleString('en-US') : String(Math.round(v * 100) / 100);
    return unit ? `${s}${unit === '%' ? '' : ' '}${unit}` : s;
  }
  return v;
};

export function Metrics({ lesson, values, prev }: { lesson: Lesson; values?: Record<string, MetricValue>; prev?: Record<string, MetricValue> }) {
  if (!lesson.metrics?.length || !values) return null;
  return (
    <div className="metrics" role="list" aria-label="Metrics">
      {lesson.metrics.map((m) => {
        const v = values[m.id];
        const p = prev?.[m.id];
        const changed = prev !== undefined && p !== v;
        let delta: 'up' | 'down' | null = null;
        let good: boolean | null = null;
        if (typeof v === 'number' && typeof p === 'number' && v !== p) {
          delta = v > p ? 'up' : 'down';
          if (m.better) good = (m.better === 'higher') === (v > p);
        }
        const tone = v === 'yes' ? 'ok' : v === 'no' ? 'danger' : undefined;
        return (
          <div key={m.id} className="metric" role="listitem" data-changed={changed || undefined}>
            <span className="metric-label">{m.label}</span>
            <span className="metric-value" data-tone={tone} key={String(v)}>
              {fmt(v, m.unit)}
              {delta && (
                <span className="metric-delta" data-good={good === null ? undefined : String(good)}>
                  {delta === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- legend ---------------- */
const KIND_LABEL: Record<PacketKind, string> = {
  req: 'request',
  res: 'response',
  data: 'data / write',
  err: 'error / blocked',
  event: 'event',
  auth: 'token / credential',
};
const ORDER: PacketKind[] = ['req', 'res', 'data', 'event', 'auth', 'err'];

export function legendKinds(lesson: Lesson): PacketKind[] {
  const s = new Set<PacketKind>();
  for (const st of lesson.steps)
    for (const f of stepScenes(st).flatMap((sc) => sc.flows ?? [])) {
      s.add(f.fail ? 'err' : (f.kind ?? 'req'));
      if (f.kind === undefined && f.fail) s.add('req');
      if (f.back && !f.fail) s.add(f.back);
    }
  return ORDER.filter((k) => s.has(k));
}

export function Legend({ lesson }: { lesson: Lesson }) {
  const kinds = legendKinds(lesson);
  if (!kinds.length) return null;
  return (
    <ul className="legend" aria-label="Legend">
      {kinds.map((k) => (
        <li key={k} data-kind={k}>
          <i />
          {lesson.legend?.[k] ?? KIND_LABEL[k]}
        </li>
      ))}
    </ul>
  );
}
