import CandidateWorkspace from '@/components/CandidateWorkspace';
import { acquisitionSeeds } from '@/lib/featured-acquisitions';
export default function Page() {
  return <CandidateWorkspace facilities={acquisitionSeeds} />;
}
