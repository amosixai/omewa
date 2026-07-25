import { motion } from 'framer-motion';
import { SignupForm } from '@/components/auth/SignupForm';

export function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/40 to-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <span className="text-lg font-bold">A</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start building with Amosix in under a minute.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a
            href="#"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </a>
        </p>
      </motion.div>
    </main>
  );
}
