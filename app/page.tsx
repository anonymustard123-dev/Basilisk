import Dashboard from '@/components/Dashboard';
import { configured } from '@/lib/server';
import { initialFacilities } from '@/lib/initial-facilities';
export const dynamic = 'force-dynamic';
export default function Page() {
  const readOnly = !configured();
  return <Dashboard seedFacilities={readOnly ? initialFacilities : []} readOnly={readOnly} />;
}
