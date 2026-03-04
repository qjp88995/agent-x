import { LinkIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function SharedExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <LinkIcon className="text-muted-foreground size-8" />
      </div>
      <h1 className="text-xl font-semibold">Link Expired or Invalid</h1>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        This share link has expired, reached its usage limit, or is no longer
        valid.
      </p>
      <Button variant="outline" asChild>
        <a href="/">Go to Homepage</a>
      </Button>
    </div>
  );
}
