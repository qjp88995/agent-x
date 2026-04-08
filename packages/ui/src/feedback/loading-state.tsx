import { cn } from '../lib/utils';

interface LoadingStateProps {
  readonly message: string;
  readonly className?: string;
}

export function LoadingState({ message, className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="text-foreground-muted text-sm">{message}</div>
    </div>
  );
}
