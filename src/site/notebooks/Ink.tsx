import { Fragment } from 'react';

/** __underline__  **bold**  ==highlight==  `code`  x_{sub}  x^{sup} — one level, no nesting. */
const RE = /(\*\*[^*]+?\*\*|__[^_]+?__|==[^=]+?==|`[^`]+`|_\{[^}]+\}|\^\{[^}]+\})/g;

export function Ink({ text }: { text: string }) {
  const parts = text.split(RE);
  return (
    <>
      {parts.map((s, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{s}</Fragment>;
        if (s.startsWith('**')) return <b key={i} className="hw-b">{s.slice(2, -2)}</b>;
        if (s.startsWith('__')) return <u key={i} className="hw-u">{s.slice(2, -2)}</u>;
        if (s.startsWith('==')) return <mark key={i} className="hw-hl">{s.slice(2, -2)}</mark>;
        if (s.startsWith('`')) return <code key={i} className="hw-c">{s.slice(1, -1)}</code>;
        if (s.startsWith('_{')) return <sub key={i}>{s.slice(2, -1)}</sub>;
        return <sup key={i}>{s.slice(2, -1)}</sup>;
      })}
    </>
  );
}

/** Plain text of an Ink string (for aria labels and titles). */
export const inkText = (text: string) => text.replace(RE, (m) => (m.startsWith('_{') || m.startsWith('^{') ? m.slice(2, -1) : m.slice(m[0] === '`' ? 1 : 2, m[0] === '`' ? -1 : -2)));
