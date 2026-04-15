import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  type FilterTab,
  FilterTabs,
  Input,
  PageHeader,
} from '@agent-x/design';
import type { UserResponse } from '@agent-x/shared';
import { UserStatus } from '@agent-x/shared';
import { AlertTriangle, Check, Copy, Users } from 'lucide-react';
import { toast } from 'sonner';

import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';
import {
  useAllUsers,
  useResetUserPassword,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/hooks/use-users';

import type { UserTableActions } from './user-table';
import { UserTable } from './user-table';

export default function UserListPage() {
  const { t } = useTranslation();
  const { data: allUsers, isLoading, error } = useAllUsers();

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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        {!filtered.length && !isLoading ? (
          <EmptyState
            icon={Users}
            title={t('users.noUsers')}
            description={t('users.noUsersDesc')}
          />
        ) : (
          <UserTable users={filtered} loading={isLoading} {...tableActions} />
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
