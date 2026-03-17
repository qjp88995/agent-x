import { useState } from 'react';

import { Check, ClipboardCopy } from 'lucide-react';

import { Button } from '../primitives/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface CopyableTextProps {
  readonly text: string;
  readonly label?: string;
  readonly truncate?: number;
  readonly copyLabel?: string;
  readonly copiedLabel?: string;
  readonly className?: string;
}

export function CopyableText({
  text,
  label,
  truncate,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  className,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  }

  const displayText =
    truncate !== undefined ? text.slice(0, truncate) : text;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-auto gap-1 px-1 py-0.5 font-mono text-xs text-foreground-muted${className ? ` ${className}` : ''}`}
          onClick={handleCopy}
        >
          {label && <span>{label}</span>}
          <span>{displayText}</span>
          {copied ? (
            <Check className="size-3 text-green-600" />
          ) : (
            <ClipboardCopy className="size-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? copiedLabel : `${copyLabel}: ${text}`}
      </TooltipContent>
    </Tooltip>
  );
}
