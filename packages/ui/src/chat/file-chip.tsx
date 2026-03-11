import { cn } from '../lib/utils';
import { File, Image as ImageIcon, X } from 'lucide-react';

type FileChipProps = {
  name: string;
  size: string; // e.g. "1.2 MB"
  type?: 'file' | 'image';
  thumbnail?: string; // URL for image preview
  onRemove?: () => void;
  className?: string;
};

function FileChip({ name, size, type = 'file', thumbnail, onRemove, className }: FileChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2 py-1.5 rounded-sm border border-border bg-card text-[11px] max-w-50',
        className,
      )}
    >
      {thumbnail ? (
        <img src={thumbnail} alt="" className="size-8 rounded object-cover shrink-0" />
      ) : type === 'image' ? (
        <ImageIcon className="size-3.5 text-foreground-ghost shrink-0" />
      ) : (
        <File className="size-3.5 text-foreground-ghost shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-foreground-secondary font-medium">{name}</p>
        <p className="text-[9px] text-foreground-ghost">{size}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-foreground-ghost hover:text-foreground-muted transition-colors"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

export { FileChip };
