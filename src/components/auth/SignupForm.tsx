import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

import { signupSchema, type SignupFormValues } from '@/lib/validation';
import { useSignup } from '@/hooks/useSignup';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthError } from '@/services/auth';
import { socialAdapter } from '@/services/social';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

function FieldError({ id, children }: { id: string; children?: string }) {
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

export function SignupForm() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const signup = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const passwordValue = watch('password');

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    signup.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: async (user) => {
          await socialAdapter.ensureProfile(user);
          setUser(user);
          navigate('/', { replace: true });
        },
        onError: (error) => {
          setServerError(
            error instanceof AuthError
              ? error.message
              : 'Something went wrong. Please try again.',
          );
        },
      },
    );
  });

  const isSubmitting = signup.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AnimatePresence>
        {serverError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <FieldError id="email-error">{errors.email.message}</FieldError>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="pr-10"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <PasswordStrengthMeter password={passwordValue} />
        {errors.password && (
          <FieldError id="password-error">{errors.password.message}</FieldError>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword ? 'confirm-error' : undefined
          }
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <FieldError id="confirm-error">
            {errors.confirmPassword.message}
          </FieldError>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <Checkbox
            id="acceptTerms"
            className="mt-0.5"
            aria-invalid={Boolean(errors.acceptTerms)}
            {...register('acceptTerms')}
          />
          <Label htmlFor="acceptTerms" className="font-normal leading-snug">
            I agree to the{' '}
            <a
              href="#"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </Label>
        </div>
        {errors.acceptTerms && (
          <FieldError id="terms-error">{errors.acceptTerms.message}</FieldError>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner />
            Creating account…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Create account
          </>
        )}
      </Button>
    </form>
  );
}
