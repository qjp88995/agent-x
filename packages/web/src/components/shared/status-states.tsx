import { useNavigate } from 'react-router';

import { Button } from '@agent-x/design';
import { AlertTriangle } from 'lucide-react';

interface LoadingStateProps {
  readonly message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-muted-foreground text-sm">{message}</div>
    </div>
  );
}

interface NotFoundStateProps {
  readonly title: string;
  readonly description: string;
  readonly backLabel: string;
  readonly backTo: string;
}

export function NotFoundState({
  title,
  description,
  backLabel,
  backTo,
}: NotFoundStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <AlertTriangle className="text-destructive mb-4 size-10" />
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      <Button variant="outline" onClick={() => navigate(backTo)}>
        {backLabel}
      </Button>
    </div>
  );
}
