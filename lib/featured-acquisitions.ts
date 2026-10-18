import { blankFacility, type Acquisition, type Evidence, type Facility } from './model.ts';
const checked = '2026-10-18T19:12:01.000Z';
function claim(
  id: string,
  fact: string,
  value: string,
  url: string,
  excerpt: string,
  status: Evidence['status'] = 'verified',
  category: Evidence['category'] = 'other',
): Evidence {
  return {
    id,
    fact,
    value,
    unit: null,
    status,
    category,
    source_title: 'Property listing / acquisition research',
    source_url: url,
    document_date: null,
    captured_at: checked,
    page_or_excerpt: excerpt,
    reviewed_by: status === 'verified' ? 'Basilisk listing audit' : null,
    reviewed_at: status === 'verified' ? checked : null,
    method: 'independent-research',
    confidence: status === 'verified' ? 'medium' : 'low',
    author: 'Basilisk acquisition research',
    conflict: false,
  };
}
function property(
  id: string,
  name: string,
  city: string,
  state: string,
  zip: string,
  order: number,
  price: number,
  sqft: number,
  url: string,
  source: string,
): Facility {
  const f = {
    ...blankFacility(name, name, city, state, zip),
    id,
    researched: true,
    updated_at: checked,
  };
  f.pjm.status = 'likely';
  f.acquisition = {
    source_id: source,
    listing_url: url,
    featured_order: order,
    asking_price_usd: price,
    price_status: 'listed',
    alternate_price_usd: null,
    building_sqft: sqft,
    area_status: 'reported',
    property_type: 'Industrial',
    occupancy: 'unknown',
    availability: 'unverified',
    checked_at: checked,
    verification_notes:
      'Listing observations require broker confirmation; utility account and PJM zone are unverified.',
    qualifying_mw: null,
    qualifying_assumption: '',
    qualifying_evidence_ids: [],
    reduction: 'unknown',
    reduction_evidence_ids: [],
  };
  f.identifiers = { listing: source };
  f.target_role = 'Listing broker / owner, then tenant facilities or energy manager';
  return f;
}
const wooster = property(
  'acq-wooster',
  '939 Wooster Road North',
  'Barberton',
  'OH',
  '44203',
  1,
  1500000,
  88438,
  'https://www.showcase.com/939-wooster-rd-n-barberton-oh-44203/41062577/',
  'showcase:41062577',
);
Object.assign(wooster.acquisition!, {
  price_status: 'unverified',
  area_status: 'disputed',
  property_type: 'Industrial / manufacturing',
  occupancy: 'occupied',
  verification_notes:
    'Supplied Showcase URL redirects to its homepage. Indexed descriptions report $1.5M and 88,438 SF, while other listing records disagree on area and address details. Availability, current price, leased premises and tenant rights need broker confirmation.',
} satisfies Partial<Acquisition>);
wooster.operator = 'Cardinal Rubber (listing-reported tenant)';
wooster.aliases = ['939 Wooster Rd N', '939 Wooster Rd North'];
wooster.evidence = [
  claim(
    'wooster-reported',
    'listing / reported price and area',
    '$1,500,000; 88,438 SF; Cardinal Rubber tenant reported',
    wooster.acquisition!.listing_url,
    'User-supplied listing details and indexed listing description; direct URL redirected during this check. These are reported facts, not confirmed current availability.',
    'suggested',
  ),
  claim(
    'wooster-area-conflict',
    'listing / area discrepancy',
    'Other listings describe 87,806 SF; exact premises unresolved',
    'https://www.crexi.com/properties/OH/Barberton/Industrial',
    'Indexed listing results differ from the supplied 88,438 SF description. Do not merge a nearby 951 Wooster listing or parcel without confirmation.',
    'suggested',
  ),
];
wooster.why =
  'Listing-reported rubber manufacturing operations make this a lead for metered-load and tenant-cooperation diligence.';
wooster.missing =
  'Is the exact industrial property still for sale, and will the tenant authorize load and DR diligence?';
wooster.next_action =
  'Confirm availability, price and exact premises with the broker, then request tenant consent, utility bills/PLC and account-specific DR history.';
const phillips = property(
  'acq-phillips',
  '320 Phillips Avenue',
  'Toledo',
  'OH',
  '43612',
  2,
  1000000,
  53847,
  'https://www.crexi.com/properties/2215844/ohio-binksformer-carlisle-fluids',
  'crexi:2215844',
);
Object.assign(phillips.acquisition!, {
  availability: 'advertised',
  property_type: 'Former industrial / R&D facility',
  occupancy: 'former-use',
  reduction: 'possible',
  verification_notes:
    'Crexi displays For Sale, $1,000,000 and 53,847 SF, with a Kohler backup generator described. A listing is not broker confirmation, a measured load study or a current generator inspection.',
} satisfies Partial<Acquisition>);
phillips.aliases = ['320 Phillips Ave', 'Binks/Former Carlisle Fluids'];
phillips.operator = 'Current operator unconfirmed';
phillips.evidence = [
  claim(
    'phillips-listing',
    'listing / price and floor area',
    '$1,000,000; 53,847 SF; advertised for sale',
    phillips.acquisition!.listing_url,
    'Listing header and property details identify this Toledo property and price/area.',
  ),
  claim(
    'phillips-generator',
    'generator / listing report',
    'Kohler backup generator; electrical rating unknown',
    phillips.acquisition!.listing_url,
    'Listing highlights identify backup equipment and climate-controlled industrial areas; current operation, rating and permits require verification.',
    'verified',
    'flexibility',
  ),
];
phillips.assets = [
  {
    id: 'phillips-kohler',
    type: 'generator',
    description: 'Kohler backup generator · kW unknown',
    count: null,
    electrical_kw: null,
    bhp_each: null,
    fuel: 'Unknown',
    operation: 'unknown',
    permit: 'unknown',
    meter_id: null,
    constraints:
      'Listing-reported equipment only. Confirm electrical nameplate, current condition, switchgear, permitted event operation and live grid load.',
    evidence_ids: ['phillips-generator'],
  },
];
phillips.why =
  'Listing-reported backup generation creates a concrete DR research lead if meaningful active grid demand and operating rights exist.';
phillips.missing =
  'What are the generator electrical rating and the site’s current operating load?';
phillips.next_action =
  'Ask the broker for generator nameplates, occupancy/load status and air permits; obtain utility and scoped DR history before estimating capacity.';
const macdade = property(
  'acq-macdade',
  '108 MacDade Boulevard',
  'Collingdale',
  'PA',
  '19023',
  3,
  775000,
  7000,
  'https://www.marcusmillichap.com/properties/198026/108-macdade-blvd',
  'marcusmillichap:198026',
);
Object.assign(macdade.acquisition!, {
  availability: 'advertised',
  price_status: 'disputed',
  alternate_price_usd: 800000,
  area_status: 'approximate',
  property_type: 'Former cold-storage warehouse',
  occupancy: 'former-use',
  verification_notes:
    'Broker page is advertised with a $775,000 header, but its description says $800,000. Preserve both prices and obtain a current broker quote. Refrigeration improvements do not establish present operation or MW.',
} satisfies Partial<Acquisition>);
macdade.operator = 'Current occupant unconfirmed';
macdade.aliases = ['108 MacDade Blvd'];
macdade.evidence = [
  claim(
    'macdade-header',
    'asking price',
    '775000',
    macdade.acquisition!.listing_url,
    'Listing header price; current broker confirmation required.',
  ),
  claim(
    'macdade-description',
    'asking price',
    '800000',
    macdade.acquisition!.listing_url,
    'Investment overview price conflicts with the header.',
  ),
  claim(
    'macdade-cold',
    'listing / former cold storage',
    'Approximately 7,000 SF; insulated space and refrigeration improvements',
    macdade.acquisition!.listing_url,
    'Broker describes prior cold-storage use and refrigeration infrastructure, without confirming present active demand.',
  ),
];
macdade.evidence[0].conflict = true;
macdade.evidence[1].conflict = true;
macdade.why =
  'Existing cold-storage improvements may support future refrigeration demand if active use and controllable load are established.';
macdade.missing = 'Is refrigeration operating today, and which asking price is current?';
macdade.next_action =
  'Resolve the price discrepancy and occupancy with the broker, then verify active refrigeration, utility account capacity versus actual bills, equipment and DR history.';
const porter = property(
  'acq-porter',
  '407 Porter Avenue',
  'Scottdale',
  'PA',
  '15683',
  4,
  420000,
  6300,
  'https://www.crexi.com/properties/2260567/pennsylvania-407-porter-avenue',
  'crexi:2260567',
);
Object.assign(porter.acquisition!, {
  availability: 'off-market',
  price_status: 'last-reported',
  area_status: 'approximate',
  property_type: 'Former refrigerated-storage facility',
  occupancy: 'vacant',
  reduction: 'no',
  verification_notes:
    'Current Crexi page identifies Off-Market, Unpriced and Historical Flyer. $420,000 / approximately 6,300 SF and vacant/freezer details are retained as user-reported historical information, not a current asking price or operating-load confirmation.',
} satisfies Partial<Acquisition>);
porter.operator = 'Vacant / operator unconfirmed';
porter.aliases = ['407 Porter Ave'];
porter.evidence = [
  claim(
    'porter-market',
    'listing / availability',
    'Off Market; Unpriced',
    porter.acquisition!.listing_url,
    'Current property page is an off-market record with a historical flyer, not an active for-sale advertisement.',
  ),
  claim(
    'porter-reported',
    'listing / historical details',
    '$420,000; approximately 6,300 SF; vacant former freezer/cold storage',
    porter.acquisition!.listing_url,
    'Historical details supplied in the acquisition brief; current page does not verify the former price, area, equipment condition or active load.',
    'suggested',
  ),
];
porter.why =
  'Reported cold-storage improvements could support a future-use investigation after availability, equipment condition and load activation are resolved.';
porter.missing =
  'Off-market and reported vacant: can it be acquired and returned to an active, metered load?';
porter.next_action =
  'Confirm sale availability with the owner/broker before spending on DR diligence; inspect refrigeration and establish a credible load-activation plan.';

// Historical records remain above for migration reproducibility; only this shortlist is displayed.
export const legacyAcquisitionSeeds: Facility[] = [wooster, phillips, macdade, porter];
const east55 = property(
  'acq-east55',
  '1893 East 55th Street',
  'Cleveland',
  'OH',
  '44103',
  1,
  1199000,
  31158,
  'https://crescorealestate.com/properties/1893-e-55th-street/',
  'cresco:1893-east-55th',
);
Object.assign(east55.acquisition!, {
  availability: 'advertised',
  property_type: 'Cold-storage / warehouse',
  occupancy: 'vacant',
  reduction: 'possible',
  verification_notes:
    'CRESCO advertises the whole building for sale at $1,199,000. Crexi reports vacant tenancy. Five walk-in coolers, 480V three-phase power, and prior electrical/roof improvements are listing claims; current operating load is unknown.',
} satisfies Partial<Acquisition>);
east55.operator = 'Vacant · listing reported';
east55.why = 'Five walk-in coolers, upgraded electrical service and 480V three-phase power.';
east55.missing = 'Active refrigeration load and recommissioning cost';
east55.next_action =
  'Contact CRESCO: Eliot Kijewski / Ryan Curtin / Coleman Sorenson, 216-520-1200; request bills, equipment inspection and current availability.';
east55.evidence = [
  claim(
    'east55-listing',
    'Sale / refrigeration',
    '$1,199,000 · 31,158 SF · five walk-in coolers',
    east55.acquisition!.listing_url,
    'Broker advertises whole building for sale; refrigeration equipment is not measured demand.',
  ),
  claim(
    'east55-vacancy',
    'Occupancy',
    'Vacant',
    'https://www.crexi.com/properties/1890268/ohio-1893-e-55th-street',
    'Crexi tenancy field reports vacant; confirm with broker.',
  ),
];
const lewisburg = property(
  'acq-lewisburg',
  '4307 US Route 40 East',
  'Lewisburg',
  'OH',
  '45338',
  4,
  3233500,
  129340,
  'https://rimarketplace.com/listing/71192/industrial/lewisburg/oh',
  'nai:4307-us40',
);
Object.assign(lewisburg.acquisition!, {
  availability: 'advertised',
  property_type: 'Cold-storage / industrial',
  occupancy: 'unknown',
  reduction: 'possible',
  verification_notes:
    'NAI Bergman syndicated listing displays For Sale at $3,233,500, 129,340 SF and 43,770 SF cold storage. Backup generator and electrical upgrades reported in 2021/2022. Older flyers carry higher prices; confirm current quote. Generator kW, fuel/tier and active load remain unknown.',
} satisfies Partial<Acquisition>);
lewisburg.operator = 'Current operator unconfirmed';
lewisburg.why =
  '43,770 SF of cold storage with listing-reported backup generation and electrical upgrades.';
lewisburg.missing = 'Current occupancy, generator rating and eligible metered reduction';
lewisburg.next_action =
  'Contact Scott Kaster, NAI Bergman, 937-673-4366; request current price, interval load, generator nameplate and permits.';
lewisburg.evidence = [
  claim(
    'lewisburg-listing',
    'Sale / refrigeration / backup generation',
    '$3,233,500 · 129,340 SF · 43,770 SF cold storage · backup generator',
    lewisburg.acquisition!.listing_url,
    'Broker-syndicated sale listing reports refrigeration, backup equipment and 2021/2022 upgrades; no qualifying MW established.',
  ),
];
lewisburg.assets = [
  {
    ...phillips.assets[0],
    id: 'lewisburg-backup',
    description: 'Listing-reported backup generator · kW unknown',
    evidence_ids: ['lewisburg-listing'],
  },
];
export const acquisitionSeeds: Facility[] = [east55, phillips, macdade, lewisburg];
