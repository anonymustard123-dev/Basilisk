import Dashboard from '@/components/Dashboard';
import { configured } from '@/lib/server';
import { seeds } from '@/lib/seeds';
export const dynamic = 'force-dynamic';
export default function Page() {
  const readOnly = !configured();
  return <Dashboard seedFacilities={readOnly ? seeds : []} readOnly={readOnly} />;
}
