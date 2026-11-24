import { Highlight, Prism, type PrismTheme } from 'prism-react-renderer';
import { memo } from 'react';

// Small grammars the bundle doesn't ship: raw HTTP messages and shell commands.
Prism.languages.http = {
  'request-line': { pattern: /^(?:GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s\S+\s+HTTP\/[\d.]+/m, alias: 'keyword' },
  'status-line': { pattern: /^HTTP\/[\d.]+\s+\d{3}.*$/m, alias: 'function' },
  'header-name': { pattern: /^[\w-]+(?=:)/m, alias: 'property' },
  comment: /#.*/,
  string: /"[^"]*"/,
  number: /\b\d+\b/,
  punctuation: /[{}[\]:,]/,
};
Prism.languages.bash = {
  comment: /#.*/,
  string: /"[^"]*"|'[^']*'/,
  function: { pattern: /^(\$\s*)?[\w.-]+/m },
  property: /\s--?[\w-]+/,
  operator: /[|&>]+/,
};
Prism.languages.sh = Prism.languages.bash;
Prism.languages.docker = {
  comment: /#.*/,
  keyword: { pattern: /^\s*(?:FROM|RUN|COPY|ADD|WORKDIR|CMD|ENTRYPOINT|EXPOSE|ENV|ARG|USER|HEALTHCHECK)\b/im },
  string: /"[^"]*"|'[^']*'/,
  property: /\bAS\b|--[\w-]+/,
};

// Colours come from CSS (token classes), so the theme is intentionally empty.
const theme: PrismTheme = { plain: {}, styles: [] };

export const CodeLines = memo(function CodeLines({
  code,
  lang = 'jsx',
  hl,
  err,
  numbers = true,
}: {
  code: string;
  lang?: string;
  hl?: number[];
  err?: number[];
  numbers?: boolean;
}) {
  const focus = (hl?.length ?? 0) + (err?.length ?? 0) > 0;
  const language = Prism.languages[lang] ? lang : 'plain';
  return (
    <Highlight prism={Prism} theme={theme} code={code.replace(/\n$/, '')} language={language}>
      {({ tokens, getTokenProps }) => (
        <code className={`code-lines${focus ? ' has-focus' : ''}`}>
          {tokens.map((line, i) => {
            const n = i + 1;
            const state = err?.includes(n) ? 'err' : hl?.includes(n) ? 'hl' : undefined;
            return (
              <span key={i} className="code-line" data-line={state}>
                {numbers && <span className="code-ln">{n}</span>}
                <span className="code-src">
                  {line.length === 1 && line[0].empty ? '​' : line.map((t, j) => <span key={j} {...getTokenProps({ token: t })} />)}
                </span>
              </span>
            );
          })}
        </code>
      )}
    </Highlight>
  );
});
