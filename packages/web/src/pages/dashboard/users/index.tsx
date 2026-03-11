import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { UserResponse } from '@agent-x/shared';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Ban,
  Check,
  Copy,
  KeyRound,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { useDateLocale } from '@/hooks/use-date-locale';
import type { UseUsersParams } from '@/hooks/use-users';
import {
  useResetUserPassword,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUsers,
} from '@/hooks/use-users';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

type SortOption = 'newest' | 'oldest' | 'name' | 'email';

const ROLE_BADGE_CONFIG: Record<
  string,
  { labelKey: string; className: string }
> = {
  ADMIN: {
    labelKey: 'users.roleAdmin',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  USER: {
    labelKey: 'users.roleUser',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

const STATUS_BADGE_CONFIG: Record<
  string,
  { labelKey: string; className: string }
> = {
  ACTIVE: {
    labelKey: 'users.statusActive',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  DISABLED: {
    labelKey: 'users.statusDisabled',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  DELETED: {
    labelKey: 'users.statusDeleted',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

function RoleBadge({ role }: { readonly role: string }) {
  const { t } = useTranslation();
  const config = ROLE_BADGE_CONFIG[role] ?? ROLE_BADGE_CONFIG.USER;
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(config.labelKey)}
    </Badge>
  );
}

function UserStatusBadge({ status }: { readonly status: string }) {
  const { t } = useTranslation();
  const config = STATUS_BADGE_CONFIG[status] ?? STATUS_BADGE_CONFIG.ACTIVE;
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(config.labelKey)}
    </Badge>
  );
}

function getUserInitial(name: string | null, email: string): string {
  if (name) return name.charAt(0).toUpperCase();
  return email.charAt(0).toUpperCase();
}

function EmptyState({ onCreateClick }: { readonly onCreateClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg mb-4 flex size-16 items-center justify-center rounded-full text-white">
        <Users className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{t('users.noUsers')}</h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {t('users.noUsersDesc')}
      </p>
      <Button onClick={onCreateClick} variant="primary">
        <Plus className="mr-2 size-4" />
        {t('users.createUser')}
      </Button>
    </div>
  );
}

export default function UserListPage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const currentUser = useAuthStore(state => state.user);

  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, dateFrom, dateTo, sortOption]);

  const queryParams = useMemo<UseUsersParams>(() => {
    const params: UseUsersParams = {
      page,
      pageSize,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter !== 'all') params.role = roleFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (dateFrom) params.registeredFrom = format(dateFrom, 'yyyy-MM-dd');
    if (dateTo) params.registeredTo = format(dateTo, 'yyyy-MM-dd');

    switch (sortOption) {
      case 'newest':
        params.sortBy = 'createdAt';
        params.sortOrder = 'desc';
        break;
      case 'oldest':
        params.sortBy = 'createdAt';
        params.sortOrder = 'asc';
        break;
      case 'name':
        params.sortBy = 'name';
        params.sortOrder = 'asc';
        break;
      case 'email':
        params.sortBy = 'email';
        params.sortOrder = 'asc';
        break;
    }

    return params;
  }, [
    debouncedSearch,
    roleFilter,
    statusFilter,
    dateFrom,
    dateTo,
    sortOption,
    page,
    pageSize,
  ]);

  const { data, isLoading, error } = useUsers(queryParams);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const resetPassword = useResetUserPassword();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: UserResponse;
    newRole: string;
  } | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] =
    useState<UserResponse | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordCopied, setTempPasswordCopied] = useState(false);
  const [disableTarget, setDisableTarget] = useState<UserResponse | null>(null);
  const [enableTarget, setEnableTarget] = useState<UserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [restoreTarget, setRestoreTarget] = useState<UserResponse | null>(null);

  // Handlers
  const handleRoleChangeConfirm = useCallback(() => {
    if (!roleChangeTarget) return;
    updateRole.mutate(
      { id: roleChangeTarget.user.id, role: roleChangeTarget.newRole },
      {
        onSuccess: () => {
          setRoleChangeTarget(null);
          toast.success(t('users.roleChanged'));
        },
        onError: () => {
          toast.error(t('users.roleChangeFailed'));
        },
      }
    );
  }, [roleChangeTarget, updateRole, t]);

  const handleResetPasswordConfirm = useCallback(() => {
    if (!resetPasswordTarget) return;
    resetPassword.mutate(resetPasswordTarget.id, {
      onSuccess: data => {
        setResetPasswordTarget(null);
        setTempPassword(data.temporaryPassword);
      },
      onError: () => {
        toast.error(t('users.resetPasswordFailed'));
      },
    });
  }, [resetPasswordTarget, resetPassword, t]);

  const handleCopyTempPassword = useCallback(async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setTempPasswordCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setTempPasswordCopied(false), 2000);
  }, [tempPassword, t]);

  const handleDisableConfirm = useCallback(() => {
    if (!disableTarget) return;
    updateStatus.mutate(
      { id: disableTarget.id, status: 'DISABLED' },
      {
        onSuccess: () => {
          setDisableTarget(null);
          toast.success(t('users.userDisabled'));
        },
        onError: () => {
          toast.error(t('users.disableFailed'));
        },
      }
    );
  }, [disableTarget, updateStatus, t]);

  const handleEnableConfirm = useCallback(() => {
    if (!enableTarget) return;
    updateStatus.mutate(
      { id: enableTarget.id, status: 'ACTIVE' },
      {
        onSuccess: () => {
          setEnableTarget(null);
          toast.success(t('users.userEnabled'));
        },
        onError: () => {
          toast.error(t('users.enableFailed'));
        },
      }
    );
  }, [enableTarget, updateStatus, t]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget || deleteConfirmEmail !== deleteTarget.email) return;
    updateStatus.mutate(
      { id: deleteTarget.id, status: 'DELETED' },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          setDeleteConfirmEmail('');
          toast.success(t('users.userDeleted'));
        },
        onError: () => {
          toast.error(t('users.deleteFailed'));
        },
      }
    );
  }, [deleteTarget, deleteConfirmEmail, updateStatus, t]);

  const handleRestoreConfirm = useCallback(() => {
    if (!restoreTarget) return;
    updateStatus.mutate(
      { id: restoreTarget.id, status: 'ACTIVE' },
      {
        onSuccess: () => {
          setRestoreTarget(null);
          toast.success(t('users.userRestored'));
        },
        onError: () => {
          toast.error(t('users.restoreFailed'));
        },
      }
    );
  }, [restoreTarget, updateStatus, t]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-[200px]" />
          <Skeleton className="h-9 w-[130px]" />
          <Skeleton className="h-9 w-[130px]" />
        </div>
        <div className="rounded-lg border">
          <div className="flex flex-col divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', { resource: t('users.title') })}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const hasUsers = users.length > 0;
  const hasAnyFilters =
    debouncedSearch ||
    roleFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateFrom ||
    dateTo;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('users.title')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('users.subtitle')}</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          variant="primary"
          className="sm:shrink-0"
        >
          <Plus className="mr-2 size-4" />
          {t('users.createUser')}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder={t('users.searchPlaceholder')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t('users.filterRole')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('users.allRoles')}</SelectItem>
            <SelectItem value="ADMIN">{t('users.roleAdmin')}</SelectItem>
            <SelectItem value="USER">{t('users.roleUser')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t('users.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('users.allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{t('users.statusActive')}</SelectItem>
            <SelectItem value="DISABLED">
              {t('users.statusDisabled')}
            </SelectItem>
            <SelectItem value="DELETED">{t('users.statusDeleted')}</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker
          value={dateFrom}
          onChange={setDateFrom}
          placeholder={t('users.registeredFrom')}
          clearable
        />
        <DatePicker
          value={dateTo}
          onChange={setDateTo}
          placeholder={t('users.registeredTo')}
          fromDate={dateFrom}
          clearable
        />
        <Select
          value={sortOption}
          onValueChange={v => setSortOption(v as SortOption)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t('users.sort')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('users.sortNewest')}</SelectItem>
            <SelectItem value="oldest">{t('users.sortOldest')}</SelectItem>
            <SelectItem value="name">{t('users.sortName')}</SelectItem>
            <SelectItem value="email">{t('users.sortEmail')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {hasUsers ? (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.columnUser')}</TableHead>
                  <TableHead>{t('users.columnRole')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t('users.columnLastActive')}
                  </TableHead>
                  <TableHead className="w-20">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const isCurrentUser = currentUser?.id === user.id;
                  const isAdmin = user.role === 'ADMIN';
                  const isDisabled = user.status === 'DISABLED';
                  const isDeleted = user.status === 'DELETED';

                  return (
                    <TableRow
                      key={user.id}
                      className={cn(
                        isDisabled && 'opacity-60',
                        isDeleted && 'opacity-40'
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback
                              className={cn(
                                'text-xs font-semibold',
                                isAdmin ? 'gradient-bg text-white' : 'bg-muted'
                              )}
                            >
                              {getUserInitial(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <Link
                            to={`/users/${user.id}`}
                            className="flex min-w-0 flex-col hover:underline"
                          >
                            <span
                              className={cn(
                                'truncate text-sm font-medium',
                                isDeleted && 'line-through'
                              )}
                            >
                              {user.name ?? '-'}
                            </span>
                            <span className="text-muted-foreground truncate text-xs">
                              {user.email}
                            </span>
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        <UserStatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                        {formatDistanceToNow(new Date(user.updatedAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </TableCell>
                      <TableCell>
                        {!isCurrentUser && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">
                                  {t('common.actions')}
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Active user actions */}
                              {user.status === 'ACTIVE' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setRoleChangeTarget({
                                        user,
                                        newRole: isAdmin ? 'USER' : 'ADMIN',
                                      })
                                    }
                                  >
                                    {isAdmin ? (
                                      <>
                                        <ShieldOff className="mr-2 size-4" />
                                        {t('users.changeToUser')}
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="mr-2 size-4" />
                                        {t('users.changeToAdmin')}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setResetPasswordTarget(user)}
                                  >
                                    <KeyRound className="mr-2 size-4" />
                                    {t('users.resetPassword')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDisableTarget(user)}
                                  >
                                    <Ban className="mr-2 size-4" />
                                    {t('users.disable')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteTarget(user)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    {t('common.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Disabled user actions */}
                              {user.status === 'DISABLED' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => setEnableTarget(user)}
                                  >
                                    <UserCheck className="mr-2 size-4" />
                                    {t('users.enable')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteTarget(user)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    {t('common.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Deleted user actions */}
                              {user.status === 'DELETED' && (
                                <DropdownMenuItem
                                  onClick={() => setRestoreTarget(user)}
                                >
                                  <RotateCcw className="mr-2 size-4" />
                                  {t('users.restore')}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                {t('users.showingRange', {
                  start: startIndex,
                  end: endIndex,
                  total,
                })}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  pageNum => (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'ghost'}
                      size="icon"
                      className="size-8"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </>
      ) : hasAnyFilters ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Search className="text-muted-foreground mb-4 size-10" />
          <h3 className="mb-1 text-lg font-semibold">{t('users.noResults')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('users.noResultsDesc')}
          </p>
        </div>
      ) : (
        <EmptyState onCreateClick={() => setCreateOpen(true)} />
      )}

      {/* Create User Dialog */}
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Role Change Confirmation */}
      <AlertDialog
        open={roleChangeTarget !== null}
        onOpenChange={open => {
          if (!open) setRoleChangeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.changeRoleTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.changeRoleDesc', {
                name:
                  roleChangeTarget?.user.name ?? roleChangeTarget?.user.email,
                role:
                  roleChangeTarget?.newRole === 'ADMIN'
                    ? t('users.roleAdmin')
                    : t('users.roleUser'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChangeConfirm}
              disabled={updateRole.isPending}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation */}
      <AlertDialog
        open={resetPasswordTarget !== null}
        onOpenChange={open => {
          if (!open) setResetPasswordTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.resetPasswordTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.resetPasswordDesc', {
                name: resetPasswordTarget?.name ?? resetPasswordTarget?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPasswordConfirm}
              disabled={resetPassword.isPending}
            >
              {t('users.resetPassword')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Temp Password Display Dialog */}
      <Dialog
        open={tempPassword !== null}
        onOpenChange={open => {
          if (!open) {
            setTempPassword(null);
            setTempPasswordCopied(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.tempPasswordTitle')}</DialogTitle>
            <DialogDescription>{t('users.tempPasswordDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="bg-muted flex-1 rounded px-3 py-2 font-mono text-sm">
              {tempPassword}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleCopyTempPassword}
            >
              {tempPasswordCopied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setTempPassword(null);
                setTempPasswordCopied(false);
              }}
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation */}
      <AlertDialog
        open={disableTarget !== null}
        onOpenChange={open => {
          if (!open) setDisableTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.disableUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.disableUserDesc', {
                name: disableTarget?.name ?? disableTarget?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableConfirm}
              disabled={updateStatus.isPending}
            >
              {t('users.disable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enable Confirmation */}
      <AlertDialog
        open={enableTarget !== null}
        onOpenChange={open => {
          if (!open) setEnableTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.enableUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.enableUserDesc', {
                name: enableTarget?.name ?? enableTarget?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEnableConfirm}
              disabled={updateStatus.isPending}
            >
              {t('users.enable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation with email input */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirmEmail('');
          }
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.deleteUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.deleteUserDesc', {
                email: deleteTarget?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-0">
            <Input
              placeholder={t('users.deleteEmailPlaceholder')}
              value={deleteConfirmEmail}
              onChange={e => setDeleteConfirmEmail(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={
                updateStatus.isPending ||
                deleteConfirmEmail !== deleteTarget?.email
              }
            >
              {updateStatus.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation */}
      <AlertDialog
        open={restoreTarget !== null}
        onOpenChange={open => {
          if (!open) setRestoreTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.restoreUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.restoreUserDesc', {
                name: restoreTarget?.name ?? restoreTarget?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              disabled={updateStatus.isPending}
            >
              {t('users.restore')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
