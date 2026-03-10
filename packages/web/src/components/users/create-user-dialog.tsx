import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { UserRole } from '@agent-x/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateUser } from '@/hooks/use-users';
import {
  type CreateUserFormValues,
  createUserSchema,
} from '@/lib/schemas/user';

interface CreateUserDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const { t } = useTranslation();
  const createUser = useCreateUser();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', password: '', name: '', role: UserRole.USER },
    mode: 'onChange',
  });

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
    }
    onOpenChange(nextOpen);
  }

  function handleCreate(values: CreateUserFormValues) {
    createUser.mutate(
      {
        email: values.email,
        password: values.password,
        name: values.name || undefined,
        role: values.role || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t('users.userCreated'));
          handleClose(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.createUserTitle')}</DialogTitle>
          <DialogDescription>{t('users.subtitle')}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleCreate)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-email">{t('users.email')}</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="user@example.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-xs">
                {t(form.formState.errors.email.message ?? '')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name">
              {t('users.name')} {t('common.optional')}
            </Label>
            <Input
              id="user-name"
              placeholder={t('auth.namePlaceholder')}
              {...form.register('name')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-password">{t('users.password')}</Label>
            <Input
              id="user-password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-xs">
                {t(form.formState.errors.password.message ?? '')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('users.role')}</Label>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value || UserRole.USER}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.USER}>USER</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!form.formState.isValid || createUser.isPending}
              variant="primary"
            >
              {createUser.isPending
                ? t('common.loading')
                : t('users.createUser')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
