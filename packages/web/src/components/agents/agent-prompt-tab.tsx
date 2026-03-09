import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Save } from 'lucide-react';

import { FormFooter } from '@/components/shared/form-footer';
import { PromptEditor } from '@/components/shared/prompt-editor';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import type { AgentFormValues } from '@/lib/schemas';

type AgentPromptTabProps = {
  form: UseFormReturn<AgentFormValues>;
  isBusy: boolean;
  isSaving: boolean;
};

function AgentPromptTab({ form, isBusy, isSaving }: AgentPromptTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-0 max-w-4xl flex-1 flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold">{t('agents.systemPrompt')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('agents.systemPromptDesc')}
        </p>
      </div>

      <FormField
        control={form.control}
        name="systemPrompt"
        render={({ field }) => (
          <FormItem className="flex min-h-0 flex-1 flex-col">
            <FormControl>
              <PromptEditor
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

      <FormFooter
        onCancel={() => navigate('/agents')}
        isSaving={isSaving}
        disabled={!form.formState.isValid}
        submitLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
        icon={<Save className="mr-2 size-4" />}
      />
    </div>
  );
}

export { AgentPromptTab };
export type { AgentPromptTabProps };
