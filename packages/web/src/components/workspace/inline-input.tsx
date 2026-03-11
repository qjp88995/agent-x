import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@agent-x/design';

import { validateFileName } from './file-tree-utils';

export function InlineInput({
  defaultValue,
  placeholder,
  selectWithoutExtension,
  existingNames,
  onSubmit,
  onCancel,
}: {
  readonly defaultValue?: string;
  readonly placeholder?: string;
  readonly selectWithoutExtension?: boolean;
  readonly existingNames?: readonly string[];
  readonly onSubmit: (value: string) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    // Delay focus to run after context menu closes and releases focus
    const timer = setTimeout(() => {
      input.focus();
      if (selectWithoutExtension && defaultValue) {
        const dotIdx = defaultValue.lastIndexOf('.');
        input.setSelectionRange(0, dotIdx > 0 ? dotIdx : defaultValue.length);
      } else {
        input.select();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [defaultValue, selectWithoutExtension]);

  const validate = useCallback(
    (name: string) => validateFileName(name, existingNames),
    [existingNames]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const value = inputRef.current?.value.trim();
      if (!value) {
        onCancel();
        return;
      }
      const err = validate(value);
      if (err) {
        setError(t(`workspace.${err}`));
        return;
      }
      onSubmit(value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="relative flex min-w-0 flex-1">
      <Input
        ref={inputRef}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={!!error}
        className="h-6 rounded border-primary px-1 text-sm shadow-none"
        onKeyDown={handleKeyDown}
        onChange={e => {
          const val = e.target.value.trim();
          const err = val ? validate(val) : null;
          setError(err ? t(`workspace.${err}`) : null);
        }}
        onBlur={() => {
          const value = inputRef.current?.value.trim();
          if (value && value !== defaultValue && !validate(value)) {
            onSubmit(value);
          } else {
            onCancel();
          }
        }}
      />
      {error && (
        <span className="absolute top-full left-0 z-10 mt-0.5 rounded bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground shadow-sm">
          {error}
        </span>
      )}
    </div>
  );
}
