import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type { PromptResponse } from '@agent-x/shared';
import { Eye, Pencil, Trash2 } from 'lucide-react';

interface PromptCardProps {
  readonly prompt: PromptResponse;
  readonly onDelete: (prompt: PromptResponse) => void;
  readonly onPreview?: (prompt: PromptResponse) => void;
}

export function PromptCard({ prompt, onDelete, onPreview }: PromptCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{prompt.name}</CardTitle>
          {prompt.category && (
            <Badge variant="muted" className="w-fit text-xs">
              {prompt.category.name}
            </Badge>
          )}
        </div>
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
      </CardHeader>

      <CardContent className="flex-1">
        {prompt.description ? (
          <p className="text-foreground-muted line-clamp-2 text-sm">
            {prompt.description}
          </p>
        ) : (
          <p className="text-foreground-muted/50 text-sm italic">
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
              <span className="text-foreground-muted text-xs">
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
                  onClick={() => onPreview?.(prompt)}
                >
                  <Eye className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('prompts.viewContent')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" asChild>
                  <Link to={`/prompts/${prompt.id}/edit`}>
                    <Pencil className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.edit')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
