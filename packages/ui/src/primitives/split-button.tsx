import { type ComponentProps, type ReactNode } from 'react';

import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../feedback/dropdown-menu';
import { cn } from '../lib/utils';
import { Button, type ButtonProps } from './button';

type SplitButtonProps = {
  /** Props forwarded to the main (left) button */
  mainProps?: Omit<ButtonProps, 'children'>;
  /** Button variant applied to both halves */
  variant?: ButtonProps['variant'];
  /** Button size applied to both halves */
  size?: ButtonProps['size'];
  /** Main button label */
  children: ReactNode;
  /** Dropdown menu content (DropdownMenuItem elements) */
  menuContent: ReactNode;
  /** Alignment of the dropdown menu */
  menuAlign?: ComponentProps<typeof DropdownMenuContent>['align'];
  /** Additional class on the wrapper */
  className?: string;
  /** Disabled state for both halves */
  disabled?: boolean;
};

function SplitButton({
  mainProps,
  variant = 'primary',
  size = 'default',
  children,
  menuContent,
  menuAlign = 'end',
  className,
  disabled,
}: SplitButtonProps) {
  const triggerSize: ButtonProps['size'] =
    size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : 'icon';

  return (
    <div className={cn('flex items-stretch', className)}>
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        {...mainProps}
        className={cn('rounded-r-none', mainProps?.className)}
      >
        {children}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={triggerSize}
            disabled={disabled}
            className="rounded-l-none border-l border-l-current/20 focus-visible:ring-0"
          >
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={menuAlign}>
          {menuContent}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { SplitButton, type SplitButtonProps };
