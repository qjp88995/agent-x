import { type FormEvent, useEffect, useState } from 'react';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import type { McpTransport as McpTransportType } from '@agent-x/shared';
import { McpTransport } from '@agent-x/shared';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useIsAdmin } from '@/hooks/use-auth';
import {
  useCreateMarketplaceMcpServer,
  useCreateMcpServer,
  useMcpServer,
  useUpdateMarketplaceMcpServer,
  useUpdateMcpServer,
} from '@/hooks/use-mcp';
import { cn } from '@/lib/utils';

const TRANSPORT_OPTIONS: readonly {
  value: McpTransportType;
  label: string;
  description: string;
}[] = [
  {
    value: McpTransport.STDIO,
    label: 'STDIO',
    description: 'Standard input/output process',
  },
  {
    value: McpTransport.SSE,
    label: 'SSE',
    description: 'Server-Sent Events transport',
  },
  {
    value: McpTransport.STREAMABLE_HTTP,
    label: 'Streamable HTTP',
    description: 'HTTP streaming transport',
  },
] as const;

function StdioConfigFields({
  command,
  onCommandChange,
  argsInput,
  onArgsChange,
  disabled,
}: {
  readonly command: string;
  readonly onCommandChange: (value: string) => void;
  readonly argsInput: string;
  readonly onArgsChange: (value: string) => void;
  readonly disabled: boolean;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="command">Command</Label>
        <Input
          id="command"
          placeholder="e.g., npx or python"
          value={command}
          onChange={e => onCommandChange(e.target.value)}
          disabled={disabled}
          required
        />
        <p className="text-muted-foreground text-xs">
          The executable command to run the MCP server.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="args">Arguments</Label>
        <Input
          id="args"
          placeholder="e.g., -y, @modelcontextprotocol/server-github"
          value={argsInput}
          onChange={e => onArgsChange(e.target.value)}
          disabled={disabled}
        />
        <p className="text-muted-foreground text-xs">
          Comma-separated list of command arguments.
        </p>
      </div>
    </>
  );
}

function HttpConfigFields({
  url,
  onUrlChange,
  headersInput,
  onHeadersChange,
  headersError,
  disabled,
}: {
  readonly url: string;
  readonly onUrlChange: (value: string) => void;
  readonly headersInput: string;
  readonly onHeadersChange: (value: string) => void;
  readonly headersError: string | null;
  readonly disabled: boolean;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          placeholder="e.g., https://mcp-server.example.com/sse"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          disabled={disabled}
          required
        />
        <p className="text-muted-foreground text-xs">
          The MCP server endpoint URL.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="headers">
          Headers{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="headers"
          placeholder={'{\n  "Authorization": "Bearer token"\n}'}
          value={headersInput}
          onChange={e => onHeadersChange(e.target.value)}
          disabled={disabled}
          rows={4}
          className="font-mono text-sm"
        />
        {headersError && (
          <p className="text-destructive text-xs">{headersError}</p>
        )}
        <p className="text-muted-foreground text-xs">
          Optional HTTP headers as JSON object.
        </p>
      </div>
    </>
  );
}

export default function McpEditorPage() {
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

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [transport, setTransport] = useState<McpTransportType>(
    McpTransport.STDIO
  );
  const [command, setCommand] = useState('');
  const [argsInput, setArgsInput] = useState('');
  const [url, setUrl] = useState('');
  const [headersInput, setHeadersInput] = useState('');
  const [headersError, setHeadersError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (existingServer) {
      setName(existingServer.name);
      setDescription(existingServer.description ?? '');
      setTransport(existingServer.transport);

      const config = existingServer.config;
      if (existingServer.transport === McpTransport.STDIO) {
        setCommand((config.command as string) ?? '');
        const args = config.args as string[] | undefined;
        setArgsInput(args?.join(', ') ?? '');
      } else {
        setUrl((config.url as string) ?? '');
        const headers = config.headers as Record<string, string> | undefined;
        if (headers && Object.keys(headers).length > 0) {
          setHeadersInput(JSON.stringify(headers, null, 2));
        }
      }
    }
  }, [existingServer]);

  // Non-admin accessing official mode → redirect
  if (isOfficialMode && !isAdmin) {
    return <Navigate to="/mcp-servers" replace />;
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

  function buildConfig(): Record<string, unknown> | null {
    if (transport === McpTransport.STDIO) {
      return {
        command: command.trim(),
        args: parseArgs(argsInput),
      };
    }

    const headers = parseHeaders(headersInput);
    if (headers === null) {
      setHeadersError('Invalid JSON format. Please enter a valid JSON object.');
      return null;
    }
    setHeadersError(null);

    return {
      url: url.trim(),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    };
  }

  const isStdioValid =
    transport === McpTransport.STDIO && command.trim().length > 0;
  const isHttpValid =
    (transport === McpTransport.SSE ||
      transport === McpTransport.STREAMABLE_HTTP) &&
    url.trim().length > 0;
  const isFormValid = name.trim().length > 0 && (isStdioValid || isHttpValid);
  const isSaving =
    createMcpServer.isPending ||
    updateMcpServer.isPending ||
    createMarketplace.isPending ||
    updateMarketplace.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isSaving) return;
    setError(null);

    const config = buildConfig();
    if (config === null) return;

    const dto = {
      name: name.trim(),
      description: description.trim() || undefined,
      transport,
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
      await navigate('/mcp-servers');
    } catch {
      setError(
        isEditMode
          ? 'Failed to update MCP server. Please try again.'
          : 'Failed to create MCP server. Please try again.'
      );
    }
  }

  function handleTransportChange(newTransport: McpTransportType) {
    setTransport(newTransport);
    setHeadersError(null);
  }

  const pageTitle = isOfficialMode
    ? isEditMode
      ? 'Edit Marketplace Server'
      : 'Add Marketplace Server'
    : isEditMode
      ? 'Edit MCP Server'
      : 'Add MCP Server';

  const pageDescription = isOfficialMode
    ? isEditMode
      ? 'Update this marketplace server configuration.'
      : 'Add a new server to the marketplace for all users.'
    : isEditMode
      ? 'Update your MCP server configuration.'
      : 'Configure a new MCP server connection.';

  if (isEditMode && isLoadingServer) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          Loading MCP server...
        </div>
      </div>
    );
  }

  if (isEditMode && !isLoadingServer && !existingServer) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">MCP Server not found</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          The MCP server you are looking for does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate('/mcp-servers')}>
          Back to MCP Servers
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/mcp-servers')}
          aria-label="Back to MCP servers"
          className="cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground text-sm">{pageDescription}</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Server Details</CardTitle>
            <CardDescription>
              Enter the connection details for your MCP server.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., GitHub MCP Server"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSaving}
                required
              />
              <p className="text-muted-foreground text-xs">
                A friendly name to identify this MCP server.
              </p>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this MCP server provides..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
              <p className="text-muted-foreground text-xs">
                Optional description of this server&apos;s capabilities.
              </p>
            </div>

            {/* Transport */}
            <div className="flex flex-col gap-2">
              <Label>Transport</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {TRANSPORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleTransportChange(option.value)}
                    className={cn(
                      'flex flex-col items-start rounded-md border p-3 text-left transition-colors',
                      transport === option.value
                        ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                        : 'hover:bg-accent',
                      isSaving && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic config fields */}
            {transport === McpTransport.STDIO ? (
              <StdioConfigFields
                command={command}
                onCommandChange={setCommand}
                argsInput={argsInput}
                onArgsChange={setArgsInput}
                disabled={isSaving}
              />
            ) : (
              <HttpConfigFields
                url={url}
                onUrlChange={setUrl}
                headersInput={headersInput}
                onHeadersChange={setHeadersInput}
                headersError={headersError}
                disabled={isSaving}
              />
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/mcp-servers')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="gradient-bg text-white hover:opacity-90 cursor-pointer"
            >
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Create Server'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
