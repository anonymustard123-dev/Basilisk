import { seeds } from './seeds.ts';
import { acquisitionSeeds } from './featured-acquisitions.ts';
export const initialFacilities = [...acquisitionSeeds, ...seeds];
