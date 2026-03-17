import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Button,
  CodeEditor,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Separator,
} from '@agent-x/design';
import { Loader2 } from 'lucide-react';

import { PolishButton } from '@/components/shared/polish-button';
import { PromptPickerButton } from '@/components/shared/prompt-picker-button';
import { SavePromptButton } from '@/components/shared/save-prompt-button';
import type { AgentFormValues } from '@/lib/schemas';

type AgentPromptTabProps = {
  form: UseFormReturn<AgentFormValues>;
  isBusy: boolean;
  isSaving: boolean;
};

function AgentPromptTab({ form, isBusy, isSaving }: AgentPromptTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function handleContentChange(content: string) {
    form.setValue('systemPrompt', content, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium">{t('agents.systemPrompt')}</h3>
          <p className="text-foreground-muted text-xs">
            {t('agents.systemPromptDesc')}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <PolishButton
            content={form.watch('systemPrompt') ?? ''}
            onApply={handleContentChange}
            disabled={isBusy}
          />
          <PromptPickerButton
            onSelect={handleContentChange}
            disabled={isBusy}
          />
          <SavePromptButton
            content={form.watch('systemPrompt') ?? ''}
            defaultName={form.watch('name')}
            disabled={isBusy}
          />
        </div>
      </div>

      <FormField
        control={form.control}
        name="systemPrompt"
        render={({ field }) => (
          <FormItem className="flex min-h-0 flex-1 flex-col">
            <FormControl>
              <CodeEditor
                value={field.value}
                onChange={field.onChange}
                placeholder={t('agents.systemPromptPlaceholder')}
                disabled={isBusy}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Footer */}
      <Separator />
      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate('/agents')}
          disabled={isSaving}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!form.formState.isValid || isSaving}
          variant="primary"
        >
          {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}

export { AgentPromptTab };
export type { AgentPromptTabProps };
