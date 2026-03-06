import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PageHeaderProps {
  readonly backTo: string;
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(backTo)}
              aria-label={backLabel}
              className="cursor-pointer"
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
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
