import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { profileSchema, type ProfileFormValues } from '@/lib/validation';
import { useProfileById, useUpdateProfile } from '@/hooks/useSocial';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';

export function EditProfilePage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { data: profile, isLoading } = useProfileById(currentUser?.id ?? '');
  const updateProfile = useUpdateProfile();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: { displayName: '', username: '', bio: '' },
  });

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        username: profile.username,
        bio: profile.bio,
      });
    }
  }, [profile, reset]);

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    updateProfile.mutate(values, {
      onSuccess: () => navigate('/profile', { replace: true }),
      onError: (error) =>
        setServerError(
          error instanceof Error ? error.message : 'Could not save changes.',
        ),
    });
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-[57px] z-10 flex items-center gap-3 border-b border-border bg-card/90 px-3 py-2.5 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-base font-semibold text-foreground">
          Edit profile
        </h1>
      </header>

      <form onSubmit={onSubmit} noValidate className="space-y-4 px-4 py-4">
        {serverError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            aria-invalid={Boolean(errors.displayName)}
            {...register('displayName')}
          />
          {errors.displayName && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            aria-invalid={Boolean(errors.username)}
            {...register('username')}
          />
          {errors.username && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            aria-invalid={Boolean(errors.bio)}
            {...register('bio')}
          />
          {errors.bio && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.bio.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={updateProfile.isPending}
          aria-busy={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </form>
    </div>
  );
}
