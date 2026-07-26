import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ImagePlus,
  Shuffle,
  Upload as UploadIcon,
} from 'lucide-react';

import { postSchema, type PostFormValues } from '@/lib/validation';
import { useCreatePost } from '@/hooks/useSocial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';

function randomImage(): string {
  return `https://picsum.photos/seed/amosix-${crypto.randomUUID().slice(0, 8)}/640/800`;
}

export function UploadPage() {
  const navigate = useNavigate();
  const createPost = useCreatePost();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    mode: 'onTouched',
    defaultValues: { caption: '', imageUrl: '' },
  });

  const imageUrl = watch('imageUrl');

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    createPost.mutate(
      { caption: values.caption, imageUrl: values.imageUrl || randomImage() },
      {
        onSuccess: () => navigate('/', { replace: true }),
        onError: () =>
          setServerError('Could not publish your post. Please try again.'),
      },
    );
  });

  const isSubmitting = createPost.isPending;

  return (
    <div className="px-4 py-4">
      <h1 className="mb-4 text-lg font-semibold text-foreground">New post</h1>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{serverError}</span>
          </div>
        )}

        <div
          className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted"
          style={{
            backgroundImage:
              'linear-gradient(135deg, oklch(0.68 0.2 264), oklch(0.62 0.2 320))',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Preview"
              className="h-full w-full object-cover"
              onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/90">
              <ImagePlus className="h-10 w-10" aria-hidden="true" />
              <span className="text-sm">Add an image URL below</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="imageUrl">Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://…"
              aria-invalid={Boolean(errors.imageUrl)}
              {...register('imageUrl')}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue('imageUrl', randomImage())}
              className="shrink-0"
            >
              <Shuffle className="h-4 w-4" aria-hidden="true" />
              Random
            </Button>
          </div>
          {errors.imageUrl && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.imageUrl.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Leave blank and we’ll pick one for you.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            placeholder="Write a caption…"
            aria-invalid={Boolean(errors.caption)}
            {...register('caption')}
          />
          {errors.caption && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.caption.message}
            </p>
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
              Publishing…
            </>
          ) : (
            <>
              <UploadIcon className="h-4 w-4" aria-hidden="true" />
              Share post
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
