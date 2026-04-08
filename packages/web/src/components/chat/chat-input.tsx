import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ChatInput as DesignChatInput,
  type FileAttachment,
  type SlashCommand,
} from '@agent-x/design';

interface ChatInputProps {
  readonly onSend: (content: string) => void;
  readonly onStop: () => void;
  readonly isLoading: boolean;
  readonly disabled?: boolean;
}

const PLACEHOLDER_COMMANDS: SlashCommand[] = [
  { id: 'help', label: 'help', description: 'Show help' },
  { id: 'clear', label: 'clear', description: 'Clear conversation' },
];

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashSearch, setSlashSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue('');
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles: FileAttachment[] = Array.from(selected).map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      size:
        file.size < 1024
          ? `${file.size} B`
          : file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type.startsWith('image/') ? 'image' : 'file',
    }));
    setFiles(prev => [...prev, ...newFiles]);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleFileRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSlashSelect = (command: SlashCommand) => {
    setValue(prev => `${prev}/${command.label} `);
    setSlashMenuOpen(false);
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-160">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <DesignChatInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          placeholder={t('common.typeMessage')}
          files={files}
          onFileRemove={handleFileRemove}
          onFileUploadClick={handleFileUploadClick}
          commands={PLACEHOLDER_COMMANDS}
          slashMenuOpen={slashMenuOpen}
          onSlashMenuOpenChange={setSlashMenuOpen}
          onSlashSelect={handleSlashSelect}
          slashSearch={slashSearch}
          onSlashSearchChange={setSlashSearch}
          streaming={isLoading}
          onStop={onStop}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
