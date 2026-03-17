import { useEffect } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PageHeader,
  Separator,
  Textarea,
} from '@agent-x/design';
import type { McpTransport as McpTransportType } from '@agent-x/shared';
import { McpTransport } from '@agent-x/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { LoadingState, NotFoundState } from '@/components/shared/status-states';
import { useIsAdmin } from '@/hooks/use-auth';
import {
  useCreateMarketplaceMcpServer,
  useCreateMcpServer,
  useMcpServer,
  useUpdateMarketplaceMcpServer,
  useUpdateMcpServer,
} from '@/hooks/use-mcp';
import { type McpFormValues, mcpSchema } from '@/lib/schemas';
import { cn } from '@/lib/utils';

const ALL_TRANSPORT_OPTIONS: readonly {
  value: McpTransportType;
  labelKey: string;
  descKey: string;
}[] = [
  {
    value: McpTransport.STDIO,
    labelKey: 'mcp.stdio',
    descKey: 'mcp.stdioDesc',
  },
  {
    value: McpTransport.SSE,
    labelKey: 'mcp.sse',
    descKey: 'mcp.sseDesc',
  },
  {
    value: McpTransport.STREAMABLE_HTTP,
    labelKey: 'mcp.streamableHttp',
    descKey: 'mcp.streamableHttpDesc',
  },
] as const;

const USER_TRANSPORT_OPTIONS = ALL_TRANSPORT_OPTIONS.filter(
  o => o.value !== McpTransport.STDIO
);

function StdioConfigFields({ disabled }: { readonly disabled: boolean }) {
  const { t } = useTranslation();
  const { control } = useFormContext<McpFormValues>();

  return (
    <>
      <FormField
        control={control}
        name="command"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('mcp.command')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('mcp.commandPlaceholder')}
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>{t('mcp.commandHint')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="args"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('mcp.arguments')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('mcp.argsPlaceholder')}
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>{t('mcp.argsHint')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function HttpConfigFields({ disabled }: { readonly disabled: boolean }) {
  const { t } = useTranslation();
  const { control } = useFormContext<McpFormValues>();

  return (
    <>
      <FormField
        control={control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('mcp.url')}</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder={t('mcp.urlPlaceholder')}
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>{t('mcp.urlHint')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="headers"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t('mcp.headers')}{' '}
              <span className="text-foreground-muted font-normal">
                {t('common.optional')}
              </span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('mcp.headersPlaceholder')}
                disabled={disabled}
                rows={4}
                className="font-mono text-sm"
                {...field}
              />
            </FormControl>
            <FormDescription>{t('mcp.headersHint')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function parseArgs(input: string): string[] {
  return input
    .split(',')
    .map(arg => arg.trim())
    .filter(arg => arg.length > 0);
}

function parseHeaders(input: string): Record<string, string> | null {
  if (input.trim().length === 0) return {};
  try {
    const parsed = JSON.parse(input) as Record<string, string>;
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function McpEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isOfficialMode = searchParams.get('type') === 'official';
  const isAdmin = useIsAdmin();
  const isEditMode = !!id;

  const { data: existingServer, isLoading: isLoadingServer } = useMcpServer(id);
  const createMcpServer = useCreateMcpServer();
  const updateMcpServer = useUpdateMcpServer();
  const createMarketplace = useCreateMarketplaceMcpServer();
  const updateMarketplace = useUpdateMarketplaceMcpServer();

  const form = useForm<McpFormValues>({
    resolver: zodResolver(mcpSchema),
    defaultValues: {
      name: '',
      description: '',
      transport: (isOfficialMode
        ? McpTransport.STDIO
        : McpTransport.SSE) as string,
      command: '',
      args: '',
      url: '',
      headers: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (existingServer) {
      const config = existingServer.config;
      const isStdio = existingServer.transport === McpTransport.STDIO;

      form.reset({
        name: existingServer.name,
        description: existingServer.description ?? '',
        transport: existingServer.transport,
        command: isStdio ? ((config.command as string) ?? '') : '',
        args: isStdio
          ? ((config.args as string[] | undefined)?.join(', ') ?? '')
          : '',
        url: !isStdio ? ((config.url as string) ?? '') : '',
        headers: !isStdio
          ? (() => {
              const headers = config.headers as
                | Record<string, string>
                | undefined;
              return headers && Object.keys(headers).length > 0
                ? JSON.stringify(headers, null, 2)
                : '';
            })()
          : '',
      });
    }
  }, [existingServer, form]);

  if (isOfficialMode && !isAdmin) {
    return <Navigate to="/mcp-servers" replace />;
  }

  const watchedTransport = form.watch('transport') as McpTransportType;

  const isSaving =
    createMcpServer.isPending ||
    updateMcpServer.isPending ||
    createMarketplace.isPending ||
    updateMarketplace.isPending;

  async function onSubmit(values: McpFormValues) {
    if (isSaving) return;

    let config: Record<string, unknown>;
    if (values.transport === McpTransport.STDIO) {
      config = {
        command: values.command?.trim(),
        args: parseArgs(values.args ?? ''),
      };
    } else {
      const headers = parseHeaders(values.headers ?? '');
      if (headers === null) {
        form.setError('headers', { message: t('mcp.headersError') });
        return;
      }
      config = {
        url: values.url?.trim(),
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      };
    }

    const dto = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      transport: values.transport as McpTransportType,
      config,
    };

    try {
      if (isOfficialMode) {
        if (isEditMode) {
          await updateMarketplace.mutateAsync({ id, dto });
        } else {
          await createMarketplace.mutateAsync(dto);
        }
      } else {
        if (isEditMode) {
          await updateMcpServer.mutateAsync({ id, dto });
        } else {
          await createMcpServer.mutateAsync(dto);
        }
      }
      toast.success(isEditMode ? t('mcp.updated') : t('mcp.created'));
      await navigate(isOfficialMode ? '/marketplace' : '/mcp-servers');
    } catch {
      toast.error(isEditMode ? t('mcp.updateFailed') : t('mcp.createFailed'));
    }
  }

  const pageTitle = isOfficialMode
    ? isEditMode
      ? t('mcp.editMarketplace')
      : t('mcp.addMarketplaceTitle')
    : isEditMode
      ? t('mcp.editServer')
      : t('mcp.addServerTitle');

  if (isEditMode && isLoadingServer) {
    return <LoadingState message={t('mcp.loadingServer')} />;
  }

  if (isEditMode && !isLoadingServer && !existingServer) {
    return (
      <NotFoundState
        title={t('mcp.notFound')}
        description={t('mcp.notFoundDesc')}
        backLabel={t('mcp.backToServers')}
        backTo={isOfficialMode ? '/marketplace' : '/mcp-servers'}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        leading={
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() =>
              navigate(isOfficialMode ? '/marketplace' : '/mcp-servers')
            }
            aria-label={t('mcp.backToServers')}
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        }
        title={pageTitle}
      />
      <div className="flex-1 overflow-auto p-5">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex max-w-2xl flex-col gap-6"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('mcp.namePlaceholder')}
                      disabled={isSaving}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('mcp.nameHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('mcp.descPlaceholder')}
                      disabled={isSaving}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('mcp.descHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transport */}
            <FormField
              control={form.control}
              name="transport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('mcp.transport')}</FormLabel>
                  <FormControl>
                    <div
                      className={cn(
                        'grid gap-3',
                        isOfficialMode ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                      )}
                    >
                      {(isOfficialMode
                        ? ALL_TRANSPORT_OPTIONS
                        : USER_TRANSPORT_OPTIONS
                      ).map(option => (
                        <button
                          key={option.value}
                          type="button"
                          disabled={isSaving}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            'flex flex-col items-start rounded-md border p-3 text-left transition-colors',
                            field.value === option.value
                              ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                              : 'hover:bg-card',
                            isSaving && 'cursor-not-allowed opacity-60'
                          )}
                        >
                          <span className="text-sm font-medium">
                            {t(option.labelKey)}
                          </span>
                          <span className="text-foreground-muted text-xs">
                            {t(option.descKey)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Dynamic config fields */}
            {watchedTransport === McpTransport.STDIO ? (
              <StdioConfigFields disabled={isSaving} />
            ) : (
              <HttpConfigFields disabled={isSaving} />
            )}

            {/* Footer */}
            <Separator />
            <div className="flex items-center gap-3">
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(isOfficialMode ? '/marketplace' : '/mcp-servers')
                }
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
                {isEditMode ? t('common.save') : t('mcp.createServer')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
