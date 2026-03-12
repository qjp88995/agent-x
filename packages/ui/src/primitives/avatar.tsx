import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '../lib/utils';
import { getAvatarColor } from '../tokens/colors';

const sizeMap = {
  sm: 'h-5.5 w-5.5 text-[9px]',
  md: 'h-7 w-7 text-[10px]',
  lg: 'h-8 w-8 text-[11px]',
} as const;

export interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof sizeMap;
  className?: string;
}

function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = name.slice(0, 2).toUpperCase();
  const bgColor = getAvatarColor(name);

  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-md',
        sizeMap[size],
        className
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center font-medium text-white"
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { Avatar };
