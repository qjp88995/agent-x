import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@agent-x/design';
import { Bot } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = email.trim().length > 0 && password.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      await navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[oklch(0.541_0.25_293/0.08)] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[oklch(0.715_0.143_215/0.08)] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="gradient-bg mb-4 flex size-12 items-center justify-center rounded-xl shadow-lg">
            <Bot className="size-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Agent-X</h1>
          <p className="text-foreground-muted mt-2 text-sm">
            {t('auth.platformDesc')}
          </p>
        </div>

        <Card className="glow-sm border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t('auth.signIn')}</CardTitle>
            <CardDescription>{t('auth.signInDesc')}</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <CardContent className="flex flex-col gap-4">
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                variant="primary"
                className="w-full transition-opacity"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
              </Button>

              <p className="text-foreground-muted text-center text-sm">
                {t('auth.noAccount')}{' '}
                <Link
                  to="/register"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {t('auth.createOne')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
