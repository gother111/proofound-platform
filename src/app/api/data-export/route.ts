import { GET as getCanonicalUserExport } from '@/app/api/user/export/route';
import { addDeprecationHeaders } from '@/lib/api/deprecation';

const CanonicalPath = '/api/user/export';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await getCanonicalUserExport();
  return addDeprecationHeaders(response, CanonicalPath);
}
