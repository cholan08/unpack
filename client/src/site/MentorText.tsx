import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * Renders the mentor's reply: paragraphs, lists, **bold**, `code`, fenced code and links.
 * Built from React elements only (no HTML injection). Links to lessons (`/mern/promises`) go through the router;
 * https links open in a new tab; anything else is shown as plain text.
 */

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\))/g;

function inline(text: string, onNavigate: () => void): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith('/') && !href.startsWith('//')) {
        return (
          <Link key={i} to={href} onClick={onNavigate}>
            {label}
          </Link>
        );
      }
      if (href.startsWith('https://')) {
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        );
      }
      return <Fragment key={i}>{label}</Fragment>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function prose(text: string, key: string, onNavigate: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  for (const [bi, block] of text.split(/\n{2,}/).entries()) {
    const lines = block.split('\n').filter((l) => l.trim());
    if (!lines.length) continue;
    if (lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l))) {
      const ordered = /^\s*\d+\./.test(lines[0]);
      const items = lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*([-*]|\d+\.)\s+/, ''), onNavigate)}</li>);
      out.push(ordered ? <ol key={`${key}-${bi}`}>{items}</ol> : <ul key={`${key}-${bi}`}>{items}</ul>);
    } else {
      out.push(
        <p key={`${key}-${bi}`}>
          {lines.map((l, li) => (
            <Fragment key={li}>
              {li > 0 && <br />}
              {inline(l, onNavigate)}
            </Fragment>
          ))}
        </p>,
      );
    }
  }
  return out;
}

export function MentorText({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  // Odd-numbered pieces are inside ``` fences (an unclosed fence, e.g. mid-sentence cut-off, still renders as code).
  const pieces = text.split(/```/);
  return (
    <div className="mentor-text">
      {pieces.map((piece, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{prose(piece, String(i), onNavigate)}</Fragment>;
        // the first line is the language tag (```js) when it is a single word; otherwise it is code
        const nl = piece.indexOf('\n');
        const firstLine = nl >= 0 ? piece.slice(0, nl).trim() : '';
        const hasLang = nl >= 0 && /^[\w+-]*$/.test(firstLine);
        const lang = hasLang ? firstLine : '';
        const code = (hasLang ? piece.slice(nl + 1) : piece).replace(/\n$/, '');
        return (
          <pre key={i} className="mentor-code" data-lang={lang || undefined}>
            <code>{code}</code>
          </pre>
        );
      })}
    </div>
  );
}
