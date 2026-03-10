import { Link } from 'react-router';

import { Plus } from 'lucide-react';

export function AddCard({
  to,
  label,
  onClick,
}: {
  readonly to?: string;
  readonly label: string;
  readonly onClick?: () => void;
}) {
  const className =
    'flex min-h-35 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors hover:border-primary/40 hover:bg-accent/50';

  const content = (
    <>
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Plus className="size-5" />
      </div>
      <span className="text-muted-foreground text-sm font-medium">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
