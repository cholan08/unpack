import { useCallback, useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  language?: string;
}

export function CodeEditor({ value, onChange, language: _language }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const nextValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(nextValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      } else if (e.key === 'Enter') {
        // Auto-indent: preserve leading whitespace of the current line
        const start = textarea.selectionStart;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.substring(lineStart, start);
        const match = currentLine.match(/^\s+/);
        const indent = match ? match[0] : '';
        if (indent) {
          e.preventDefault();
          const nextValue = value.substring(0, start) + '\n' + indent + value.substring(start);
          onChange(nextValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
          }, 0);
        }
      }
    },
    [value, onChange],
  );

  const lineCount = value.split('\n').length;

  return (
    <div className="code-editor-container">
      <div className="code-editor-gutter" aria-hidden>
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i} className="code-editor-ln">
            {i + 1}
          </span>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="code-editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-label="Code editor"
      />
    </div>
  );
}
