// @agent-x/design — Component Library

// Utilities
export { cn } from './lib/utils';

// Tokens
export { AVATAR_COLORS, COLORS, getAvatarColor } from './tokens/colors';
export { DURATION, EASE, VARIANTS } from './tokens/motion';

// Primitives
export { Button, buttonVariants } from './primitives/button';
export { Input } from './primitives/input';
export { Label } from './primitives/label';
export { Textarea } from './primitives/textarea';
export { Badge, badgeVariants } from './primitives/badge';
export { Avatar } from './primitives/avatar';
export { Separator } from './primitives/separator';
export { Skeleton } from './primitives/skeleton';
export { Switch } from './primitives/switch';
export { Checkbox } from './primitives/checkbox';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './primitives/select';
export { Slider } from './primitives/slider';
export { ScrollArea, ScrollBar } from './primitives/scroll-area';

// Data
export { DataTable, type Column, type DataTableProps } from './data/data-table';
export { ViewToggle, type ViewMode } from './data/view-toggle';
export { FilterTabs, type FilterTab } from './data/filter-tabs';

// Feedback
export { Toaster, toast } from './feedback/toast';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './feedback/dialog';
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './feedback/alert-dialog';
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './feedback/tooltip';
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from './feedback/popover';
export {
  CommandPalette,
  CommandPaletteInput,
  CommandPaletteList,
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteEmpty,
  CommandPaletteSeparator,
  CommandPaletteItemIcon,
  CommandPaletteRoot,
  Kbd,
  useCommandPalette,
} from './feedback/command-palette';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './feedback/dropdown-menu';

// Navigation
export { IconSidebar, type SidebarItem } from './navigation/icon-sidebar';
export { PageHeader } from './navigation/page-header';

// Layout
export { PageTransition } from './layout/page-transition';
export { StaggerList, StaggerItem } from './layout/stagger-list';

// Chat
export { MessageBubble, CodeBlock } from './chat/message-bubble';
export { ThinkingBlock } from './chat/thinking-block';
export { FileChip } from './chat/file-chip';
export { SlashCommandMenu, type SlashCommand } from './chat/slash-command-menu';
export { VoiceRecorder, type VoiceRecorderState } from './chat/voice-recorder';
export { ChatInput, type FileAttachment } from './chat/chat-input';
