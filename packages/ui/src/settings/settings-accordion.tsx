import { createContext, type ReactNode, use } from 'react';

import { Content, Root, Trigger } from '@radix-ui/react-collapsible';
import { ChevronRight } from 'lucide-react';

import { cn } from '../lib/utils';

type SettingsAccordionContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const SettingsAccordionContext =
  createContext<SettingsAccordionContextValue | null>(null);

function useSettingsAccordion() {
  const ctx = use(SettingsAccordionContext);
  if (!ctx)
    throw new Error(
      'useSettingsAccordion must be used within SettingsAccordion'
    );
  return ctx;
}

function SettingsAccordion({
  value,
  onValueChange,
  children,
  className,
}: {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <SettingsAccordionContext value={{ value, onValueChange }}>
      <div className={cn('flex flex-col gap-3', className)}>{children}</div>
    </SettingsAccordionContext>
  );
}

function SettingsAccordionItem({
  value,
  disabled,
  children,
  className,
}: {
  readonly value: string;
  readonly disabled?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const { value: activeValue, onValueChange } = useSettingsAccordion();
  const isOpen = activeValue === value;

  return (
    <Root
      open={isOpen}
      onOpenChange={open => onValueChange(open ? value : '')}
      className={cn(
        'rounded-lg border bg-card transition-colors',
        isOpen ? 'border-primary/20' : 'border-border',
        disabled && 'opacity-70',
        className
      )}
    >
      {children}
    </Root>
  );
}

function SettingsAccordionTrigger({
  title,
  description,
  summary,
  trailing,
  className,
}: {
  readonly title: string;
  readonly description?: string;
  readonly summary?: ReactNode;
  readonly trailing?: ReactNode;
  readonly className?: string;
}) {
  return (
    <Trigger asChild>
      <button
        type="button"
        className={cn(
          'group flex w-full items-center justify-between gap-3 px-4 py-3 text-left',
          'data-[state=open]:border-b data-[state=open]:border-border',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <ChevronRight className="text-foreground-ghost group-data-[state=open]:text-primary size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          <div>
            <div className="text-sm font-medium">{title}</div>
            {description && (
              <div className="text-foreground-muted mt-0.5 text-xs">
                {description}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {summary && (
            <div className="flex items-center gap-1.5 group-data-[state=open]:hidden">
              {summary}
            </div>
          )}
          {trailing && (
            <div
              onClick={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
              }}
            >
              {trailing}
            </div>
          )}
        </div>
      </button>
    </Trigger>
  );
}

function SettingsAccordionContent({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <Content
      forceMount
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
        'data-[state=open]:grid-rows-[1fr] data-[state=open]:opacity-100',
        'data-[state=closed]:grid-rows-[0fr] data-[state=closed]:opacity-0',
        className
      )}
    >
      <div className="overflow-hidden">
        <div className="p-4">{children}</div>
      </div>
    </Content>
  );
}

export {
  SettingsAccordion,
  SettingsAccordionContent,
  SettingsAccordionItem,
  SettingsAccordionTrigger,
};
