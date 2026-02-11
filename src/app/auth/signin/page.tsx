import { redirect } from 'next/navigation';

export default function AuthSigninRedirectPage() {
  redirect('/login');
}
