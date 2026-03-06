import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormCardProps {
  readonly title: string;
  readonly description: string;
  readonly maxWidth?: 'max-w-2xl' | 'max-w-4xl';
  readonly className?: string;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

export function FormCard({
  title,
  description,
  maxWidth = 'max-w-2xl',
  className,
  footer,
  children,
}: FormCardProps) {
  return (
    <Card className={cn(maxWidth, className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">{children}</CardContent>
      {footer && (
        <CardFooter className="flex justify-end gap-3 border-t pt-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
