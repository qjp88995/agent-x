import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { Bot } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterPage() {
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
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      );
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
          <p className="text-muted-foreground mt-2 text-sm">
            Create a new account
          </p>
        </div>

        <Card className="glow-sm border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Fill in the details below to get started
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4">
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">
                  Name{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="gradient-bg hover:opacity-90 w-full cursor-pointer text-white transition-opacity"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>

              <p className="text-muted-foreground text-center text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
