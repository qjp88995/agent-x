import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type FilterTab,
  FilterTabs,
  Input,
  PageHeader,
  Skeleton,
  StaggerItem,
  StaggerList,
  ViewToggle,
} from '@agent-x/design';
import type { UserResponse } from '@agent-x/shared';
import { UserStatus } from '@agent-x/shared';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Ban,
  Check,
  Copy,
  KeyRound,
  MoreHorizontal,
  RotateCcw,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { AddCard } from '@/components/shared/add-card';
import { EmptyState } from '@/components/shared/empty-state';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { useDateLocale } from '@/hooks/use-date-locale';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';
import {
  useAllUsers,
  useResetUserPassword,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/hooks/use-users';
import { useViewMode } from '@/hooks/use-view-mode';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

import type { UserTableActions } from './user-table';
import { UserTable } from './user-table';

function UserCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-7 rounded-md" />
        </div>
      </CardFooter>
    </Card>
  );
}

function UserCard({
  user,
  onRoleChange,
  onResetPassword,
  onDisable,
  onEnable,
  onDelete,
  onRestore,
}: {
  readonly user: UserResponse;
} & UserTableActions) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const currentUser = useAuthStore(state => state.user);
  const isCurrentUser = currentUser?.id === user.id;
  const isAdmin = user.role === 'ADMIN';

  const statusVariantMap: Record<
    string,
    'success' | 'warning' | 'destructive'
  > = {
    ACTIVE: 'success',
    DISABLED: 'warning',
    DELETED: 'destructive',
  };
  const statusLabelMap: Record<string, string> = {
    ACTIVE: 'users.statusActive',
    DISABLED: 'users.statusDisabled',
    DELETED: 'users.statusDeleted',
  };

  return (
    <Card className="flex flex-col transition-all duration-200 hover:border-primary/20 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-3">
          <Avatar name={user.name ?? user.email} size="lg" />
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">
              <Link
                to={`/users/${user.id}`}
                className={cn(
                  'hover:underline',
                  user.status === UserStatus.DELETED && 'line-through'
                )}
              >
                {user.name ?? user.email}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isAdmin ? 'info' : 'default'}>
                {isAdmin ? t('users.roleAdmin') : t('users.roleUser')}
              </Badge>
              <Badge variant={statusVariantMap[user.status] ?? 'default'}>
                {t(statusLabelMap[user.status] ?? 'users.statusActive')}
              </Badge>
            </div>
          </div>
        </div>
        {!isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('common.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.status === UserStatus.ACTIVE && (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      onRoleChange(user, isAdmin ? 'USER' : 'ADMIN')
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
                  <DropdownMenuItem onClick={() => onResetPassword(user)}>
                    <KeyRound className="mr-2 size-4" />
                    {t('users.resetPassword')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDisable(user)}>
                    <Ban className="mr-2 size-4" />
                    {t('users.disable')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(user)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </>
              )}
              {user.status === UserStatus.DISABLED && (
                <>
                  <DropdownMenuItem onClick={() => onEnable(user)}>
                    <UserCheck className="mr-2 size-4" />
                    {t('users.enable')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(user)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </>
              )}
              {user.status === UserStatus.DELETED && (
                <DropdownMenuItem onClick={() => onRestore(user)}>
                  <RotateCcw className="mr-2 size-4" />
                  {t('users.restore')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-foreground-muted truncate text-sm">{user.email}</p>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-between">
          <span className="text-foreground-muted text-xs">
            {formatDistanceToNow(new Date(user.updatedAt), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function UserListPage() {
  const { t } = useTranslation();
  const { data: allUsers, isLoading, error } = useAllUsers();
  const [view, setView] = useViewMode('users');

  const { filter, setFilter, filtered } = useFilteredSearch(allUsers, {
    searchKeys: ['name', 'email'],
    filterKey: 'status',
  });

  const activeCount = allUsers?.filter(
    u => u.status === UserStatus.ACTIVE
  ).length;
  const disabledCount = allUsers?.filter(
    u => u.status === UserStatus.DISABLED
  ).length;
  const deletedCount = allUsers?.filter(
    u => u.status === UserStatus.DELETED
  ).length;

  const filterTabs: FilterTab[] = [
    { key: FILTER_ALL, label: t('users.allStatuses'), count: allUsers?.length },
    {
      key: UserStatus.ACTIVE,
      label: t('users.statusActive'),
      count: activeCount,
    },
    {
      key: UserStatus.DISABLED,
      label: t('users.statusDisabled'),
      count: disabledCount,
    },
    {
      key: UserStatus.DELETED,
      label: t('users.statusDeleted'),
      count: deletedCount,
    },
  ];

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

  // Shared action handlers for both table and card views
  const tableActions: UserTableActions = {
    onRoleChange: (user, newRole) => setRoleChangeTarget({ user, newRole }),
    onResetPassword: user => setResetPasswordTarget(user),
    onDisable: user => setDisableTarget(user),
    onEnable: user => setEnableTarget(user),
    onDelete: user => setDeleteTarget(user),
    onRestore: user => setRestoreTarget(user),
  };

  const handleRoleChangeConfirm = useCallback(() => {
    if (!roleChangeTarget) return;
    updateRole.mutate(
      { id: roleChangeTarget.user.id, role: roleChangeTarget.newRole },
      {
        onSuccess: () => {
          setRoleChangeTarget(null);
          toast.success(t('users.roleChanged'));
        },
        onError: () => toast.error(t('users.roleChangeFailed')),
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
      onError: () => toast.error(t('users.resetPasswordFailed')),
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
        onError: () => toast.error(t('users.disableFailed')),
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
        onError: () => toast.error(t('users.enableFailed')),
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
        onError: () => toast.error(t('users.deleteFailed')),
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
        onError: () => toast.error(t('users.restoreFailed')),
      }
    );
  }, [restoreTarget, updateStatus, t]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', {
            resource: t('users.title').toLowerCase(),
          })}
        </h3>
        <p className="text-foreground-muted text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <PageHeader
        title={t('users.title')}
        description={t('users.subtitle')}
        search
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            {t('users.createUser')}
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-5">
        <FilterTabs tabs={filterTabs} value={filter} onChange={setFilter} />
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          view === 'table' ? (
            <UserTable users={[]} loading {...tableActions} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          )
        ) : !filtered.length ? (
          <EmptyState
            icon={Users}
            title={t('users.noUsers')}
            description={t('users.noUsersDesc')}
          />
        ) : view === 'table' ? (
          <UserTable users={filtered} {...tableActions} />
        ) : (
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <StaggerItem>
              <AddCard
                label={t('users.createUser')}
                onClick={() => setCreateOpen(true)}
              />
            </StaggerItem>
            {filtered.map(user => (
              <StaggerItem key={user.id}>
                <UserCard user={user} {...tableActions} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>

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
            <code className="bg-surface flex-1 rounded px-3 py-2 font-mono text-sm">
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
