import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { Button, Input, Label } from '@agent-x/design';
import { Bot } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore(s => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = email.trim().length > 0 && password.length >= 6;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const trimmedName = name.trim();
      await register(
        email.trim(),
        password,
        trimmedName.length > 0 ? trimmedName : undefined
      );
      await navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-80">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="bg-primary mb-3 flex size-10 items-center justify-center rounded-lg shadow-lg">
            <Bot className="size-5 text-white" />
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px]">Agent-X</h1>
          <p className="text-foreground-ghost mt-1 text-xs">
            {t('auth.platformDesc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Label htmlFor="name">
              {t('common.name')}{' '}
              <span className="text-foreground-ghost font-normal">
                {t('common.optional')}
              </span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t('auth.namePlaceholder')}
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth.passwordHint')}
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-1 w-full"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
          </Button>

          <p className="text-foreground-ghost text-center text-[11px]">
            {t('auth.hasAccount')}{' '}
            <Link
              to="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
