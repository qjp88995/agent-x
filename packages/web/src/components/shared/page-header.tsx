import type { ReactNode } from 'react';
import type { To } from 'react-router';
import { useNavigate } from 'react-router';

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  readonly backTo: string | number;
  readonly backLabel: string;
  readonly title: string;
  readonly description: string;
  readonly titleExtra?: ReactNode;
  readonly children?: ReactNode;
}

export function PageHeader({
  backTo,
  backLabel,
  title,
  description,
  titleExtra,
  children,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                typeof backTo === 'number'
                  ? navigate(backTo)
                  : navigate(backTo as To)
              }
              aria-label={backLabel}
            >
              <ArrowLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{backLabel}</TooltipContent>
        </Tooltip>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {titleExtra}
          </div>
          <p className="text-foreground-muted text-sm">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
