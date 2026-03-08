import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WorkspaceFileResponse } from '@agent-x/shared';
import Editor, { type OnMount } from '@monaco-editor/react';
import { FileImage, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useFileContent, useUpdateFileContent } from '@/hooks/use-workspace';
import { cn } from '@/lib/utils';

const LANGUAGE_MAP: Record<string, string> = {
  'text/javascript': 'javascript',
  'application/javascript': 'javascript',
  'text/typescript': 'typescript',
  'application/typescript': 'typescript',
  'text/html': 'html',
  'text/css': 'css',
  'application/json': 'json',
  'text/xml': 'xml',
  'application/xml': 'xml',
  'text/markdown': 'markdown',
  'text/x-python': 'python',
  'text/x-java': 'java',
  'text/x-go': 'go',
  'text/x-rust': 'rust',
  'text/x-c': 'c',
  'text/x-cpp': 'cpp',
  'text/x-csharp': 'csharp',
  'text/x-ruby': 'ruby',
  'text/x-php': 'php',
  'text/yaml': 'yaml',
  'application/yaml': 'yaml',
  'application/x-yaml': 'yaml',
  'text/x-shellscript': 'shell',
  'text/x-sql': 'sql',
  'image/svg+xml': 'xml',
};

const EXT_LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  cs: 'csharp',
  php: 'php',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'ini',
  md: 'markdown',
  mdx: 'markdown',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  dockerfile: 'dockerfile',
  graphql: 'graphql',
  gql: 'graphql',
  prisma: 'graphql',
  vue: 'html',
  svelte: 'html',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  swift: 'swift',
  r: 'r',
  lua: 'lua',
  dart: 'dart',
};

function detectLanguage(file: WorkspaceFileResponse): string {
  // Try mime type first
  const fromMime = LANGUAGE_MAP[file.mimeType];
  if (fromMime) return fromMime;

  // Fall back to extension
  const ext = file.path.split('.').pop()?.toLowerCase() ?? '';
  const baseName = file.path.split('/').pop()?.toLowerCase() ?? '';

  if (baseName === 'dockerfile') return 'dockerfile';
  if (baseName === 'makefile') return 'makefile';

  return EXT_LANGUAGE_MAP[ext] ?? 'plaintext';
}

function isTextFile(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/yaml' ||
    mimeType === 'application/x-yaml' ||
    mimeType === 'image/svg+xml'
  );
}

interface OpenTab {
  readonly file: WorkspaceFileResponse;
  readonly modified: boolean;
}

interface FileEditorProps {
  readonly conversationId: string;
  readonly tabs: readonly OpenTab[];
  readonly activeFileId: string | undefined;
  readonly onSelectTab: (fileId: string) => void;
  readonly onCloseTab: (fileId: string) => void;
  readonly onTabModified: (fileId: string, modified: boolean) => void;
}

export function FileEditor({
  conversationId,
  tabs,
  activeFileId,
  onSelectTab,
  onCloseTab,
  onTabModified,
}: FileEditorProps) {
  const { t } = useTranslation();
  const activeTab = tabs.find(tab => tab.file.id === activeFileId);
  const activeFile = activeTab?.file;

  const { data: fileData, isLoading } = useFileContent(
    conversationId,
    activeFile?.id
  );
  const content = fileData?.content;
  const updateContent = useUpdateFileContent();

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const [pendingContent, setPendingContent] = useState<Record<string, string>>(
    {}
  );

  // Reset pending content when switching files
  useEffect(() => {
    if (activeFile && content !== undefined && !pendingContent[activeFile.id]) {
      // Content loaded fresh, no pending edits
    }
  }, [activeFile, content, pendingContent]);

  const handleEditorMount: OnMount = useCallback(editor => {
    editorRef.current = editor;

    // Ctrl+S / Cmd+S to save
    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [
        // Monaco KeyMod.CtrlCmd | Monaco KeyCode.KeyS
        2048 | 49,
      ],
      run: () => {
        // Trigger save via DOM event so React can handle it
        document.dispatchEvent(new CustomEvent('workspace-save'));
      },
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!activeFile || !conversationId) return;

    const currentContent = pendingContent[activeFile.id];
    if (currentContent === undefined) return;

    updateContent.mutate(
      {
        conversationId,
        fileId: activeFile.id,
        content: currentContent,
      },
      {
        onSuccess: () => {
          onTabModified(activeFile.id, false);
          setPendingContent(prev => {
            const next = { ...prev };
            delete next[activeFile.id];
            return next;
          });
          toast.success(t('workspace.fileSaved'));
        },
        onError: () => {
          toast.error(t('workspace.saveFailed'));
        },
      }
    );
  }, [
    activeFile,
    conversationId,
    pendingContent,
    updateContent,
    onTabModified,
    t,
  ]);

  // Listen for save events from Ctrl+S
  useEffect(() => {
    const listener = () => handleSave();
    document.addEventListener('workspace-save', listener);
    return () => document.removeEventListener('workspace-save', listener);
  }, [handleSave]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!activeFile || value === undefined) return;
      setPendingContent(prev => ({ ...prev, [activeFile.id]: value }));
      onTabModified(activeFile.id, value !== content);
    },
    [activeFile, content, onTabModified]
  );

  const editorTheme = document.documentElement.classList.contains('dark')
    ? 'vs-dark'
    : 'light';

  if (tabs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <FileImage className="mb-2 size-8 opacity-40" />
        <p className="text-sm">{t('workspace.selectFile')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center border-b bg-muted/20 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.file.id}
            type="button"
            className={cn(
              'flex items-center gap-1.5 border-r px-3 py-1.5 text-xs transition-colors shrink-0',
              tab.file.id === activeFileId
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:bg-background/50'
            )}
            onClick={() => onSelectTab(tab.file.id)}
          >
            <span className="truncate max-w-[120px]">
              {tab.file.path.split('/').pop()}
            </span>
            {tab.modified && (
              <span className="size-1.5 rounded-full bg-primary shrink-0" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-4 cursor-pointer hover:bg-accent"
              onClick={e => {
                e.stopPropagation();
                onCloseTab(tab.file.id);
              }}
            >
              <X className="size-3" />
            </Button>
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeFile && !isTextFile(activeFile.mimeType) ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-2">
            <FileImage className="size-8 opacity-40" />
            <p className="text-sm">{t('workspace.binaryFile')}</p>
            {activeFile.mimeType.startsWith('image/') && (
              <img
                src={`/api/conversations/${conversationId}/files/${activeFile.id}/download`}
                alt={activeFile.path}
                className="max-h-[60%] max-w-[80%] object-contain mt-2"
              />
            )}
          </div>
        ) : (
          <Editor
            key={activeFile?.id}
            language={activeFile ? detectLanguage(activeFile) : 'plaintext'}
            value={
              activeFile ? (pendingContent[activeFile.id] ?? content ?? '') : ''
            }
            theme={editorTheme}
            onMount={handleEditorMount}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 8 },
            }}
          />
        )}
      </div>
    </div>
  );
}

export type { OpenTab };
