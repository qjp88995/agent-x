import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { PromptResponse } from '@agent-x/shared';
import { Eye, Pencil, Trash2 } from 'lucide-react';

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

interface MarketplaceCardProps {
  readonly prompt: PromptResponse;
  readonly isAdmin: boolean;
  readonly onDelete: (prompt: PromptResponse) => void;
  readonly onPreview: (prompt: PromptResponse) => void;
}

export function MarketplaceCard({
  prompt,
  isAdmin,
  onDelete,
  onPreview,
}: MarketplaceCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader
        className={
          isAdmin
            ? 'flex flex-row items-start justify-between gap-2 space-y-0'
            : undefined
        }
      >
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{prompt.name}</CardTitle>
          {prompt.category && (
            <Badge variant="secondary" className="w-fit text-xs">
              {prompt.category.name}
            </Badge>
          )}
        </div>
        {isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost-destructive"
                size="icon"
                className="size-8"
                onClick={() => onDelete(prompt)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">{t('common.delete')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.delete')}</TooltipContent>
          </Tooltip>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        {prompt.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {prompt.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-sm italic">
            {t('common.noDescription')}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.length > 0 ? (
              prompt.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">
                {t('prompts.noTags')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onPreview(prompt)}
                >
                  <Eye className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('prompts.viewContent')}</TooltipContent>
            </Tooltip>
            {isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    asChild
                  >
                    <Link to={`/prompts/${prompt.id}/edit?type=system`}>
                      <Pencil className="size-3.5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.edit')}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
