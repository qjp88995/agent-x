import { useMemo } from 'react';

import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';

import { cmThemeDark, cmThemeLight } from '../lib/codemirror-themes';
import { useIsDark } from '../lib/use-is-dark';
import { cn } from '../lib/utils';

interface CodeEditorProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

function CodeEditor({
  value = '',
  onChange,
  placeholder,
  disabled = false,
  className,
}: CodeEditorProps) {
  const isDark = useIsDark();

  const extensions = useMemo(
    () => [
      markdown(),
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
      theme={isDark ? cmThemeDark : cmThemeLight}
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
      height="100%"
      className={cn('min-h-0 flex-1 **:[.cm-editor]:h-full', className)}
    />
  );
}

export { CodeEditor, type CodeEditorProps };
