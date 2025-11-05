// Force dynamic rendering to prevent build-time prerendering
export const dynamic = 'force-dynamic';

// Import the client component
import AdminMetricsClient from './AdminMetricsClient';

export default function AdminMetricsPage() {
  return <AdminMetricsClient />;
}
