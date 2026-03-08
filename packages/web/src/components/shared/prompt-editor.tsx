import { useEffect, useMemo, useState } from 'react';

import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';

import { cn } from '@/lib/utils';

interface PromptEditorProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function PromptEditor({
  value = '',
  onChange,
  placeholder,
  disabled = false,
  className,
}: PromptEditorProps) {
  const isDark = useIsDark();

  const extensions = useMemo(
    () => [
      EditorView.lineWrapping,
      ...(disabled ? [EditorView.editable.of(false)] : []),
    ],
    [disabled]
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      theme={isDark ? 'dark' : 'light'}
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        foldGutter: false,
        autocompletion: false,
        bracketMatching: false,
        closeBrackets: false,
        lintKeymap: false,
        completionKeymap: false,
      }}
      className={cn('min-h-0 flex-1 overflow-hidden rounded-md', className)}
    />
  );
}
