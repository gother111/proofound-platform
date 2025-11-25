import { redirect } from 'next/navigation';

/**
 * This layout redirects from the deprecated /app/admin route
 * to the main /admin route which has proper navigation and auth
 */
export default function AdminLayout() {
  redirect('/admin');
}
