import { useTranslation } from 'react-i18next';

import type { SystemProviderResponse } from '@agent-x/shared';
import { Loader2, Pencil, PlugZap, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTestSystemProvider } from '@/hooks/use-system-config';
import { cn } from '@/lib/utils';

import { PROTOCOL_CONFIG } from './constants';

export function ProviderCard({
  provider,
  onEdit,
  onDelete,
}: {
  readonly provider: SystemProviderResponse;
  readonly onEdit: (provider: SystemProviderResponse) => void;
  readonly onDelete: (provider: SystemProviderResponse) => void;
}) {
  const { t } = useTranslation();
  const testProvider = useTestSystemProvider();

  function handleTest() {
    testProvider.mutate(provider.id, {
      onSuccess: result => {
        if (result.success) {
          toast.success(t('systemConfig.testSuccess'));
        } else {
          toast.error(t('systemConfig.testFailed'));
        }
      },
      onError: () => {
        toast.error(t('systemConfig.testFailed'));
      },
    });
  }

  const protocolConfig = PROTOCOL_CONFIG[provider.protocol];

  return (
    <Card className="flex flex-col transition-all duration-200 hover:border-primary/20 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{provider.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('border-0', protocolConfig.className)}
            >
              {t(protocolConfig.labelKey)}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-block size-2 rounded-full',
                  provider.isActive ? 'bg-green-500' : 'bg-gray-400'
                )}
              />
              <span className="text-muted-foreground text-xs">
                {provider.isActive ? t('common.active') : t('common.inactive')}
              </span>
            </div>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost-destructive"
              size="icon"
              className="size-8"
              onClick={() => onDelete(provider)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">{t('common.delete')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.delete')}</TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-muted-foreground truncate text-sm">
          {provider.baseUrl}
        </p>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={handleTest}
                disabled={testProvider.isPending}
              >
                {testProvider.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <PlugZap className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {testProvider.isPending
                ? t('systemConfig.testing')
                : t('systemConfig.testConnection')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onEdit(provider)}
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.edit')}</TooltipContent>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}
