import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Send, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatInputProps {
  readonly onSend: (content: string) => void;
  readonly onStop: () => void;
  readonly isLoading: boolean;
  readonly disabled?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const { t } = useTranslation();
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need for chat input
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        listItem: false,
        bulletList: false,
        orderedList: false,
      }),
      Placeholder.configure({
        placeholder: t('common.typeMessage'),
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'chat-input-editor outline-none text-sm leading-relaxed min-h-11 max-h-50 overflow-y-auto px-4 py-3',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSubmitFromEditor();
          return true;
        }
        return false;
      },
    },
    editable: !disabled && !isLoading,
  });

  const handleSubmitFromEditor = useCallback(() => {
    if (!editor || isLoadingRef.current) return;
    const text = editor.getText().trim();
    if (!text) return;
    onSendRef.current(text);
    editor.commands.clearContent();
  }, [editor]);

  // Sync editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && !isLoading);
    }
  }, [editor, disabled, isLoading]);

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="border-border/50 focus-within:ring-primary/30 focus-within:border-primary/50 w-full rounded-xl border shadow-sm focus-within:ring-1">
          <EditorContent editor={editor} />
        </div>
        {isLoading ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="size-11 shrink-0 rounded-xl"
                onClick={onStop}
              >
                <Square className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.stop')}</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="gradient"
                className="size-11 shrink-0 rounded-xl"
                onClick={handleSubmitFromEditor}
                disabled={disabled}
              >
                <Send className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.send')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
