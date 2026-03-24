// @agent-x/design — Component Library

// Utilities
export { cn } from './lib/utils';

// Tokens
export { AVATAR_COLORS, COLORS, getAvatarColor } from './tokens/colors';
export { DURATION, EASE, VARIANTS } from './tokens/motion';

// Primitives
export { Avatar } from './primitives/avatar';
export { Badge, badgeVariants } from './primitives/badge';
export { Button, buttonVariants } from './primitives/button';
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './primitives/card';
export { Checkbox } from './primitives/checkbox';
export { CodeEditor, type CodeEditorProps } from './primitives/code-editor';
export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './primitives/collapsible';
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from './primitives/form';
export { Input } from './primitives/input';
export { Label } from './primitives/label';
export { ScrollArea, ScrollBar } from './primitives/scroll-area';
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
export { Separator } from './primitives/separator';
export { Skeleton } from './primitives/skeleton';
export { Slider } from './primitives/slider';
export { SplitButton, type SplitButtonProps } from './primitives/split-button';
export { Switch } from './primitives/switch';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './primitives/tabs';
export { Textarea } from './primitives/textarea';

// context-menu
export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './primitives/context-menu';

// resizable
export {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './primitives/resizable';

// Data
export { CompactCardItem, CompactCardList } from './data/compact-card-list';
export { type Column, DataTable, type DataTableProps } from './data/data-table';
export { type FilterTab, FilterTabs } from './data/filter-tabs';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './data/table';
export { type ViewMode, ViewToggle } from './data/view-toggle';

// Feedback
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
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteItemIcon,
  CommandPaletteList,
  CommandPaletteRoot,
  CommandPaletteSeparator,
  Kbd,
  useCommandPalette,
} from './feedback/command-palette';
export { CopyableText } from './feedback/copyable-text';
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './feedback/dropdown-menu';
export { EmptyState } from './feedback/empty-state';
export { ErrorState } from './feedback/error-state';
export { LoadingState } from './feedback/loading-state';
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from './feedback/popover';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './feedback/sheet';
export { toast, Toaster } from './feedback/toast';
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './feedback/tooltip';

// Navigation
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './navigation/breadcrumb';
export {
  IconSidebar,
  type SidebarFooter,
  type SidebarItem,
} from './navigation/icon-sidebar';
export { PageHeader } from './navigation/page-header';
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './navigation/pagination';

// Settings
export {
  SettingsAccordion,
  SettingsAccordionContent,
  SettingsAccordionItem,
  SettingsAccordionTrigger,
} from './settings/settings-accordion';
export { SettingsLayout } from './settings/settings-layout';
export {
  SettingsNav,
  SettingsNavGroup,
  SettingsNavItem,
} from './settings/settings-nav';

// Layout
export { PageTransition } from './layout/page-transition';
export { StaggerItem, StaggerList } from './layout/stagger-list';

// Chat
export { ChatInput, type FileAttachment } from './chat/chat-input';
export {
  type FileChange,
  FileChangeCard,
  type FileChangeOperation,
} from './chat/file-change-card';
export { FileChip } from './chat/file-chip';
export { MarkdownContent } from './chat/markdown-content';
export { CodeBlock, MessageBubble } from './chat/message-bubble';
export { type SlashCommand, SlashCommandMenu } from './chat/slash-command-menu';
export { ThinkingBlock } from './chat/thinking-block';
export { TimeCard } from './chat/time-card';
export { ToolCallBlock, type ToolState } from './chat/tool-call-block';
export { VoiceRecorder, type VoiceRecorderState } from './chat/voice-recorder';

// Workspace
export { FileEditor, type FileEditorLabels } from './workspace/file-editor';
export {
  type DeleteTarget,
  type EditingNode,
  FileTree,
} from './workspace/file-tree';
export { InlineInput, type InlineInputLabels } from './workspace/inline-input';
export { type FileTreeLabels } from './workspace/tree-node-item';
export { type ClipboardItem, type WorkspaceFile } from './workspace/types';
export { type OpenTab } from './workspace/types';
export {
  type HttpClient,
  useWorkspaceApi,
  type WorkspaceApiConfig,
  WorkspaceApiProvider,
} from './workspace/workspace-api-context';
export {
  WorkspacePanel,
  type WorkspacePanelLabels,
} from './workspace/workspace-panel';
