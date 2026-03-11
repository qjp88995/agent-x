import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import { Check, ClipboardCopy } from 'lucide-react';

interface CopyableIdProps {
  readonly id: string;
  readonly label?: string;
}

export function CopyableId({ id, label }: CopyableIdProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  }

  const shortId = id.slice(0, 8);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-1 px-1 py-0.5 font-mono text-xs text-foreground-muted"
          onClick={handleCopy}
        >
          {label && <span>{label}</span>}
          <span>{shortId}</span>
          {copied ? (
            <Check className="size-3 text-green-600" />
          ) : (
            <ClipboardCopy className="size-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? t('common.copied') : `${t('common.copy')} ID: ${id}`}
      </TooltipContent>
    </Tooltip>
  );
}
