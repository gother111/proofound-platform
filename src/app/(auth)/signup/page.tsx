import { signUp } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-display font-semibold text-primary-500 mb-2">
          Create your account
        </h1>
        <p className="text-neutral-dark-600 mb-8">Join Proofound and get started</p>

        <form action={signUp as any} className="space-y-6">
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full">
            Sign up
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-light-300 text-center">
          <p className="text-sm text-neutral-dark-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
