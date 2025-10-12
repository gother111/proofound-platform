import { signIn } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-display font-semibold text-primary-500 mb-2">Welcome back</h1>
        <p className="text-neutral-dark-600 mb-8">Log in to your Proofound account</p>

        <form action={signIn as any} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/reset-password" className="text-sm text-primary-600 hover:text-primary-700">
            Forgot password?
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-light-300 text-center">
          <p className="text-sm text-neutral-dark-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
