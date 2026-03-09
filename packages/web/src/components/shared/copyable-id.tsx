import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Check, ClipboardCopy } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 font-mono text-xs transition-colors"
        >
          {label && <span>{label}</span>}
          <span>{shortId}</span>
          {copied ? (
            <Check className="size-3 text-green-600" />
          ) : (
            <ClipboardCopy className="size-3" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? t('common.copied') : `${t('common.copy')} ID: ${id}`}
      </TooltipContent>
    </Tooltip>
  );
}
