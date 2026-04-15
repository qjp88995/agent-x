import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Avatar,
  Badge,
  Button,
  type Column,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@agent-x/design';
import type { UserResponse } from '@agent-x/shared';
import { UserStatus } from '@agent-x/shared';
import { formatDistanceToNow } from 'date-fns';
import {
  Ban,
  KeyRound,
  MoreHorizontal,
  RotateCcw,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
} from 'lucide-react';

import { useDateLocale } from '@/hooks/use-date-locale';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export interface UserTableActions {
  readonly onRoleChange: (user: UserResponse, newRole: string) => void;
  readonly onResetPassword: (user: UserResponse) => void;
  readonly onDisable: (user: UserResponse) => void;
  readonly onEnable: (user: UserResponse) => void;
  readonly onDelete: (user: UserResponse) => void;
  readonly onRestore: (user: UserResponse) => void;
}

interface UserTableProps extends UserTableActions {
  readonly users: UserResponse[];
  readonly loading?: boolean;
}

export function UserTable({
  users,
  loading,
  onRoleChange,
  onResetPassword,
  onDisable,
  onEnable,
  onDelete,
  onRestore,
}: UserTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = useDateLocale();
  const currentUser = useAuthStore(state => state.user);

  const columns: Column<UserResponse>[] = [
    {
      key: 'name',
      header: t('users.columnUser'),
      render: user => (
        <div className="flex items-center gap-3">
          <Avatar name={user.name ?? user.email} size="md" />
          <div className="flex flex-col gap-0.5">
            <span
              className={cn(
                'text-foreground text-sm font-medium',
                user.status === UserStatus.DELETED && 'line-through'
              )}
            >
              {user.name ?? '-'}
            </span>
            <span className="text-foreground-muted line-clamp-1 text-xs">
              {user.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('users.columnRole'),
      width: '120px',
      hideOnMobile: true,
      render: user => (
        <Badge variant={user.role === 'ADMIN' ? 'info' : 'default'}>
          {user.role === 'ADMIN' ? t('users.roleAdmin') : t('users.roleUser')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      width: '120px',
      hideOnMobile: true,
      render: user => {
        const variantMap: Record<
          string,
          'success' | 'warning' | 'destructive'
        > = {
          ACTIVE: 'success',
          DISABLED: 'warning',
          DELETED: 'destructive',
        };
        const labelMap: Record<string, string> = {
          ACTIVE: 'users.statusActive',
          DISABLED: 'users.statusDisabled',
          DELETED: 'users.statusDeleted',
        };
        return (
          <Badge variant={variantMap[user.status] ?? 'default'}>
            {t(labelMap[user.status] ?? 'users.statusActive')}
          </Badge>
        );
      },
    },
    {
      key: 'lastActive',
      header: t('users.columnLastActive'),
      width: '160px',
      hideOnMobile: true,
      render: user => (
        <span className="text-foreground-muted text-xs">
          {formatDistanceToNow(new Date(user.updatedAt), {
            addSuffix: true,
            locale: dateLocale,
          })}
        </span>
      ),
    },
  ];

  function rowActions(user: UserResponse) {
    const isCurrentUser = currentUser?.id === user.id;
    if (isCurrentUser) return null;

    const isAdmin = user.role === 'ADMIN';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={e => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{t('common.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user.status === UserStatus.ACTIVE && (
            <>
              <DropdownMenuItem
                onClick={() => onRoleChange(user, isAdmin ? 'USER' : 'ADMIN')}
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
    );
  }

  return (
    <DataTable<UserResponse>
      columns={columns}
      data={users}
      keyExtractor={user => user.id}
      onRowClick={user => navigate(`/users/${user.id}`)}
      rowActions={rowActions}
      loading={loading}
      emptyState={<span>{t('users.noUsers')}</span>}
    />
  );
}
