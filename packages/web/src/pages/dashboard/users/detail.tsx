import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { format } from 'date-fns';
import {
  AlertTriangle,
  Ban,
  Bot,
  Check,
  Copy,
  Files,
  Key,
  KeyRound,
  MessageSquare,
  RotateCcw,
  Shield,
  ShieldOff,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/page-header';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDateLocale } from '@/hooks/use-date-locale';
import {
  useResetUserPassword,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUser,
} from '@/hooks/use-users';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

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

function getUserInitial(name: string | null, email: string): string {
  if (name) return name.charAt(0).toUpperCase();
  return email.charAt(0).toUpperCase();
}

interface StatBoxProps {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: number;
  readonly colorClass: string;
}

function StatBox({ icon: Icon, label, value, colorClass }: StatBoxProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-lg',
          colorClass
        )}
      >
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-muted-foreground text-sm">{label}</p>
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const dateLocale = useDateLocale();
  const currentUser = useAuthStore(state => state.user);

  const { data: user, isLoading, error } = useUser(id);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const resetPassword = useResetUserPassword();

  const isCurrentUser = currentUser?.id === user?.id;

  // Dialog states
  const [roleChangeTarget, setRoleChangeTarget] = useState<string | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordCopied, setTempPasswordCopied] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [enableOpen, setEnableOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);

  const handleRoleChange = useCallback(() => {
    if (!user || !roleChangeTarget) return;
    updateRole.mutate(
      { id: user.id, role: roleChangeTarget },
      {
        onSuccess: () => {
          setRoleChangeTarget(null);
          toast.success(t('users.roleChanged'));
        },
        onError: () => toast.error(t('users.roleChangeFailed')),
      }
    );
  }, [user, roleChangeTarget, updateRole, t]);

  const handleResetPassword = useCallback(() => {
    if (!user) return;
    resetPassword.mutate(user.id, {
      onSuccess: data => {
        setResetPasswordOpen(false);
        setTempPassword(data.temporaryPassword);
      },
      onError: () => toast.error(t('users.resetPasswordFailed')),
    });
  }, [user, resetPassword, t]);

  const handleCopyTempPassword = useCallback(async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setTempPasswordCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setTempPasswordCopied(false), 2000);
  }, [tempPassword, t]);

  const handleDisable = useCallback(() => {
    if (!user) return;
    updateStatus.mutate(
      { id: user.id, status: 'DISABLED' },
      {
        onSuccess: () => {
          setDisableOpen(false);
          toast.success(t('users.userDisabled'));
        },
        onError: () => toast.error(t('users.disableFailed')),
      }
    );
  }, [user, updateStatus, t]);

  const handleEnable = useCallback(() => {
    if (!user) return;
    updateStatus.mutate(
      { id: user.id, status: 'ACTIVE' },
      {
        onSuccess: () => {
          setEnableOpen(false);
          toast.success(t('users.userEnabled'));
        },
        onError: () => toast.error(t('users.enableFailed')),
      }
    );
  }, [user, updateStatus, t]);

  const handleDelete = useCallback(() => {
    if (!user || deleteConfirmEmail !== user.email) return;
    updateStatus.mutate(
      { id: user.id, status: 'DELETED' },
      {
        onSuccess: () => {
          setDeleteOpen(false);
          setDeleteConfirmEmail('');
          toast.success(t('users.userDeleted'));
        },
        onError: () => toast.error(t('users.deleteFailed')),
      }
    );
  }, [user, deleteConfirmEmail, updateStatus, t]);

  const handleRestore = useCallback(() => {
    if (!user) return;
    updateStatus.mutate(
      { id: user.id, status: 'ACTIVE' },
      {
        onSuccess: () => {
          setRestoreOpen(false);
          toast.success(t('users.userRestored'));
        },
        onError: () => toast.error(t('users.restoreFailed')),
      }
    );
  }, [user, updateStatus, t]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8 rounded-full" />
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-1 h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', { resource: t('users.userDetail') })}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  const displayName = user.name ?? user.email;
  const roleConfig = ROLE_BADGE_CONFIG[user.role] ?? ROLE_BADGE_CONFIG.USER;
  const statusConfig =
    STATUS_BADGE_CONFIG[user.status] ?? STATUS_BADGE_CONFIG.ACTIVE;
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backTo="/users"
        backLabel={t('users.backToUsers')}
        title={t('users.userDetail')}
        description={user.email}
      />

      {/* User header */}
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback
            className={cn(
              'text-lg font-semibold',
              isAdmin ? 'gradient-bg text-white' : 'bg-muted'
            )}
          >
            {getUserInitial(user.name, user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2
              className={cn(
                'text-xl font-semibold',
                user.status === 'DELETED' && 'line-through'
              )}
            >
              {displayName}
            </h2>
            <Badge
              variant="outline"
              className={cn('border-0', roleConfig.className)}
            >
              {t(roleConfig.labelKey)}
            </Badge>
            <Badge
              variant="outline"
              className={cn('border-0', statusConfig.className)}
            >
              {t(statusConfig.labelKey)}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('users.profileInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <InfoRow label={t('users.userId')} value={user.id} mono />
            <InfoRow label={t('users.email')} value={user.email} />
            <InfoRow label={t('users.name')} value={user.name ?? '-'} />
            <InfoRow label={t('users.role')} value={t(roleConfig.labelKey)} />
            <InfoRow
              label={t('common.status')}
              value={t(statusConfig.labelKey)}
            />
            <InfoRow
              label={t('users.registered')}
              value={format(new Date(user.createdAt), 'PPP', {
                locale: dateLocale,
              })}
            />
            {user.deletedAt && (
              <InfoRow
                label={t('common.delete')}
                value={format(new Date(user.deletedAt), 'PPP', {
                  locale: dateLocale,
                })}
              />
            )}
          </CardContent>
        </Card>

        {/* Management Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('users.managementActions')}</CardTitle>
            <CardDescription>{t('users.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Active user actions - hidden for current user (self-protection) */}
            {user.status === 'ACTIVE' && !isCurrentUser && (
              <>
                <ActionButton
                  icon={isAdmin ? ShieldOff : Shield}
                  label={
                    isAdmin
                      ? t('users.demoteToUser')
                      : t('users.promoteToAdmin')
                  }
                  description={t('users.currentRole', {
                    role: t(roleConfig.labelKey),
                  })}
                  onClick={() =>
                    setRoleChangeTarget(isAdmin ? 'USER' : 'ADMIN')
                  }
                />
                <ActionButton
                  icon={KeyRound}
                  label={t('users.resetPassword')}
                  description={t('users.resetPasswordShort')}
                  onClick={() => setResetPasswordOpen(true)}
                />
                <ActionButton
                  icon={Ban}
                  label={t('users.disableAccount')}
                  description={t('users.disableAccountDesc')}
                  onClick={() => setDisableOpen(true)}
                  variant="warning"
                />
                <ActionButton
                  icon={Trash2}
                  label={t('users.deleteUser')}
                  description={t('users.disableAccountDesc')}
                  onClick={() => setDeleteOpen(true)}
                  variant="destructive"
                />
              </>
            )}

            {user.status === 'DISABLED' && !isCurrentUser && (
              <>
                <ActionButton
                  icon={UserCheck}
                  label={t('users.enableAccount')}
                  description={t('users.enableAccountDesc')}
                  onClick={() => setEnableOpen(true)}
                />
                <ActionButton
                  icon={Trash2}
                  label={t('users.deleteUser')}
                  description={t('users.deleteUserDesc', {
                    email: user.email,
                  })}
                  onClick={() => setDeleteOpen(true)}
                  variant="destructive"
                />
              </>
            )}

            {user.status === 'DELETED' && (
              <ActionButton
                icon={RotateCcw}
                label={t('users.restoreUser')}
                description={t('users.enableAccountDesc')}
                onClick={() => setRestoreOpen(true)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('users.activityStats')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatBox
              icon={Bot}
              label={t('users.agents')}
              value={user.stats.agentCount}
              colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatBox
              icon={MessageSquare}
              label={t('users.conversations')}
              value={user.stats.conversationCount}
              colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatBox
              icon={Files}
              label={t('users.workspaceFiles')}
              value={user.stats.workspaceFileCount}
              colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            />
            <StatBox
              icon={Key}
              label={t('users.apiKeys')}
              value={user.stats.apiKeyCount}
              colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            />
            <StatBox
              icon={Sparkles}
              label={t('users.customSkills')}
              value={user.stats.skillCount}
              colorClass="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
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
                name: displayName,
                role:
                  roleChangeTarget === 'ADMIN'
                    ? t('users.roleAdmin')
                    : t('users.roleUser'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              disabled={updateRole.isPending}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.resetPasswordTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.resetPasswordDesc', { name: displayName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={resetPassword.isPending}
            >
              {t('users.resetPassword')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Temp Password Display */}
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

      {/* Disable Dialog */}
      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.disableUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.disableUserDesc', { name: displayName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={updateStatus.isPending}
            >
              {t('users.disable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enable Dialog */}
      <AlertDialog open={enableOpen} onOpenChange={setEnableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.enableUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.enableUserDesc', { name: displayName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEnable}
              disabled={updateStatus.isPending}
            >
              {t('users.enable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={open => {
          if (!open) {
            setDeleteOpen(false);
            setDeleteConfirmEmail('');
          }
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.deleteUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.deleteUserDesc', { email: user.email })}
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
              onClick={handleDelete}
              disabled={
                updateStatus.isPending || deleteConfirmEmail !== user.email
              }
            >
              {updateStatus.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Dialog */}
      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.restoreUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.restoreUserDesc', { name: displayName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
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

function InfoRow({
  label,
  value,
  mono,
}: {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span
        className={cn(
          'text-right text-sm font-medium',
          mono && 'font-mono text-xs'
        )}
      >
        {value}
      </span>
    </div>
  );
}

interface ActionButtonProps {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly description: string;
  readonly onClick: () => void;
  readonly variant?: 'default' | 'warning' | 'destructive';
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  variant = 'default',
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
        variant === 'warning' && 'border-yellow-200 dark:border-yellow-900/50',
        variant === 'destructive' && 'border-red-200 dark:border-red-900/50'
      )}
    >
      <Icon
        className={cn(
          'size-5 shrink-0',
          variant === 'default' && 'text-muted-foreground',
          variant === 'warning' && 'text-yellow-600 dark:text-yellow-400',
          variant === 'destructive' && 'text-red-600 dark:text-red-400'
        )}
      />
      <div className="flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            variant === 'destructive' && 'text-red-600 dark:text-red-400'
          )}
        >
          {label}
        </p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </button>
  );
}
