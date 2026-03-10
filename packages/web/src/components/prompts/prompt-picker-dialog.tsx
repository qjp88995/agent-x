import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PromptResponse } from '@agent-x/shared';
import { ArrowLeft, Eye, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePromptMarket, usePrompts } from '@/hooks/use-prompts';

const ALL_CATEGORIES = '__all__';

interface PromptPickerDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSelect: (content: string) => void;
}

export function PromptPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: PromptPickerDialogProps) {
  const { t } = useTranslation();
  const { data: marketPrompts } = usePromptMarket();
  const { data: customPrompts } = usePrompts();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [preview, setPreview] = useState<PromptResponse | null>(null);

  const allPrompts = useMemo(() => {
    const custom = customPrompts ?? [];
    const market = marketPrompts ?? [];
    return [...custom, ...market];
  }, [customPrompts, marketPrompts]);

  const categories = useMemo(() => {
    const names = new Set<string>();
    for (const prompt of allPrompts) {
      if (prompt.category) {
        names.add(prompt.category.name);
      }
    }
    return Array.from(names).sort();
  }, [allPrompts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allPrompts.filter(prompt => {
      if (category !== ALL_CATEGORIES && prompt.category?.name !== category) {
        return false;
      }
      if (!q) return true;
      return (
        prompt.name.toLowerCase().includes(q) ||
        (prompt.description?.toLowerCase().includes(q) ?? false) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(q))
      );
    });
  }, [allPrompts, search, category]);

  function resetState() {
    setSearch('');
    setCategory(ALL_CATEGORIES);
    setPreview(null);
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      resetState();
    }
    onOpenChange(value);
  }

  function handleSelect(content: string) {
    onSelect(content);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{t('prompts.selectPrompt')}</DialogTitle>
          <DialogDescription>{t('prompts.selectPromptDesc')}</DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreview(null)}
              >
                <ArrowLeft className="mr-1 size-4" />
                {t('common.back')}
              </Button>
              <span className="text-sm font-medium">{preview.name}</span>
            </div>
            {(preview.category ||
              (preview.tags && preview.tags.length > 0)) && (
              <div className="flex flex-wrap gap-1.5">
                {preview.category && (
                  <Badge variant="secondary">{preview.category.name}</Badge>
                )}
                {preview.tags.map(tag => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <ScrollArea className="max-h-[60vh]">
              <pre className="bg-muted whitespace-pre-wrap rounded-md p-4 font-mono text-sm">
                {preview.content}
              </pre>
            </ScrollArea>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => handleSelect(preview.content)}
              >
                {t('prompts.useThisPrompt')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
                <Input
                  placeholder={t('prompts.searchPrompts')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>
                    {t('prompts.allCategories')}
                  </SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="max-h-[60vh]">
              <div className="flex flex-col gap-2">
                {filtered.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    {t('common.noResults')}
                  </p>
                ) : (
                  filtered.map(prompt => (
                    <div
                      key={prompt.id}
                      className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {prompt.name}
                          </span>
                          {prompt.category && (
                            <Badge variant="secondary" className="shrink-0">
                              {prompt.category.name}
                            </Badge>
                          )}
                        </div>
                        {prompt.description && (
                          <p className="text-muted-foreground truncate text-xs">
                            {prompt.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-2 flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreview(prompt)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelect(prompt.content)}
                        >
                          {t('prompts.useThisPrompt')}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
