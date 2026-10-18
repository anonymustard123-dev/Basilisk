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

// MW-first shortlist: listing-reported infrastructure is separate from qualifying DR capacity.
export const previousAcquisitionSeeds: Facility[] = [east55, phillips, macdade, lewisburg];
const ravenna = property(
  'acq-ravenna',
  '6800 North Chestnut Street',
  'Ravenna',
  'OH',
  '44266',
  1,
  0,
  185000,
  'https://www.showcase.com/6800-n-chestnut-st-ravenna-oh-44266/37959305/',
  'svn:1548912',
);
Object.assign(ravenna.acquisition!, {
  asking_price_usd: null,
  price_status: 'unverified',
  availability: 'advertised',
  occupancy: 'occupied',
  property_type: 'Heavy-power industrial campus',
  reduction: 'possible',
  verification_notes:
    'SVN Summit syndicated sale listing advertises 10 MW incoming power on 69 kV service. Expansion descriptions conflict: one says 22 MW approved, another says load study underway; exclude expansion and 1 MW solar from DR MW. Asking price is undisclosed. Leased/occupied use is reported, not verified interval load.',
} satisfies Partial<Acquisition>);
ravenna.operator = 'Chestnut Commerce Center · tenants unconfirmed';
ravenna.why = '10 MW incoming service reported; existing industrial campus with current income.';
ravenna.missing =
  'Actual occupied-meter load, controllable process load, DR history and asking price';
ravenna.next_action =
  'SVN Summit / Aaron Davis, 330-221-7297: request price, rent roll, bills/intervals, tags, single-line and utility confirmation of existing 10 MW; resolve expansion study.';
ravenna.evidence = [
  claim(
    'ravenna-power',
    'Incoming electrical service',
    '10 MW via 69 kV line; asking price undisclosed',
    ravenna.acquisition!.listing_url,
    'Broker-syndicated sale advertisement. Incoming service is not measured load or qualifying DR.',
  ),
  claim(
    'ravenna-expansion',
    'Expansion / occupancy',
    '22 MW expansion under study; solar and future capacity excluded',
    'https://brevitas.com/p/4U5JofGP/chestnut-commerce-center',
    'Indexed broker syndication reports current income and live 10 MW, but 22 MW under load study; direct page requires login. Expansion conflicts with Showcase approval language.',
    'suggested',
  ),
];
ravenna.evidence[1].conflict = true;
const butler = property(
  'acq-butler',
  '629 East Butler Road',
  'Butler',
  'PA',
  '16002',
  2,
  6500000,
  200000,
  'https://www.crexi.com/properties/1151843/pennsylvania-629-e-butler-rd',
  'crexi:1151843',
);
Object.assign(butler.acquisition!, {
  availability: 'advertised',
  occupancy: 'occupied',
  property_type: 'Heavy-power industrial / distribution',
  reduction: 'possible',
  verification_notes:
    'NAI Burns Scalo listing shows For Sale at $6.5M, 200,000 SF and 5 MW of three-phase power into the building. LoopNet describes 55% leased. No interval demand, generator or curtailment commitment supplied. Broker OM identifies West Penn Power; account-level PJM mapping still required.',
} satisfies Partial<Acquisition>);
butler.operator = 'Multi-tenant industrial · operators unconfirmed';
butler.why =
  '5 MW power into the building reported; 200,000 SF industrial property with leased space.';
butler.missing = 'Tenant-controlled reduction and active meter demand versus 5 MW service rating';
butler.next_action =
  'NAI Burns Scalo / Chris Garrity, 412-266-5865: request rent roll, tenant consent, interval demand/tags, enrollment history and a production-safe curtailment plan.';
butler.evidence = [
  claim(
    'butler-power',
    'Sale / incoming power',
    '$6,500,000 · 200,000 SF · 5 MW three-phase service',
    butler.acquisition!.listing_url,
    'Current broker listing advertises service rating, not active or qualified reduction.',
  ),
  claim(
    'butler-leases',
    'Occupancy',
    '55% leased',
    'https://www.loopnet.com/Listing/629-E-Butler-Rd-Butler-PA/32121997/',
    'Listing reports leased occupancy; tenant account data and rights not supplied.',
  ),
  claim(
    'butler-utility',
    'Utility',
    'West Penn Power',
    'https://naiburnsscalo.com/wp-content/uploads/2022/01/629-E-Butler-Offering-Memorandum-digital.pdf',
    'Broker memorandum identifies utility, not account eligibility or measured load.',
  ),
];
const montana = property(
  'acq-montana',
  '2300 Montana Avenue',
  'Cincinnati',
  'OH',
  '45239',
  3,
  5500000,
  65000,
  'https://cincinnatilisting.com/listings/2300-montana-ave-cincinnati-oh-45239/',
  'cincinnati:2300-montana',
);
montana.acquisition!.building_sqft = 65000;
Object.assign(montana.acquisition!, {
  availability: 'advertised',
  occupancy: 'occupied',
  property_type: 'Office campus / enterprise data center',
  reduction: 'possible',
  verification_notes:
    'Broker page marked Active at $5.5M, 65,000 SF, 75% leased and approximately 2 MW available data-center power with backup generators. Available power is not current demand; generator kW, emissions tier, redundancy reserve and tenant rights are unknown. Duke Energy Ohio is reported by Baxtel; verify utility account and zone.',
} satisfies Partial<Acquisition>);
montana.operator = 'Multi-tenant campus · data-center operator unconfirmed';
montana.why =
  '2 MW data-center power reported with backup generators; campus advertised 75% leased.';
montana.missing =
  'Generator usable rating, live critical load, redundancy reserve and tenant consent';
montana.next_action =
  'Request current OM from listing broker: tenant/account consent, data-center interval demand, generator nameplates/permits, test logs and utility tags; confirm prior DR enrollment.';
montana.evidence = [
  claim(
    'montana-power',
    'Sale / data-center infrastructure',
    '$5,500,000 · 65,000 SF · 2 MW available power · backup generators',
    montana.acquisition!.listing_url,
    'Broker page marked Active, 75% leased; available capacity is not verified DR.',
  ),
  claim(
    'montana-utility',
    'Utility / redundant systems',
    'Duke Energy Ohio; backup generation',
    'https://baxtel.com/listings/cincinnati-2-mw-data-center-office-campus',
    'Listing corroboration; exact utility/account rights and generator rating require diligence.',
  ),
];
montana.assets = [
  {
    ...phillips.assets[0],
    id: 'montana-backup',
    description: 'Backup generators reported · aggregate kW unknown',
    evidence_ids: ['montana-power'],
  },
];
const sandstone = property(
  'acq-sandstone',
  '5 Sandstone Way',
  'Dunbar',
  'PA',
  '15431',
  4,
  11000000,
  101300,
  'https://www.loopnet.com/Listing/5-Sandstone-way-Dunbar-PA/28499335/',
  'loopnet:28499335',
);
Object.assign(sandstone.acquisition!, {
  availability: 'advertised',
  occupancy: 'vacant',
  property_type: 'Powered industrial shell',
  reduction: 'possible',
  verification_notes:
    'SVN Three Rivers sale listing offers $11M, 101,300 SF industrial shell with 14+ MW power available to the site. Requires user specification/buildout; this is a future operating-load case, not current dispatchable demand. Exclude expansion potential from present DR. No backup generation established.',
} satisfies Partial<Acquisition>);
sandstone.operator = 'Shell · future operating tenant required';
sandstone.why =
  '14+ MW site power advertised; industrial shell with completed utility connections.';
sandstone.missing =
  'Funded operating tenant, actual energized capacity, buildout and future load profile';
sandstone.next_action =
  'SVN Three Rivers: obtain utility service/energization confirmation, full tenant fitout budget, lease-up and operating plan, then partner eligibility review. No current DR premium.';
sandstone.evidence = [
  claim(
    'sandstone-power',
    'Sale / power availability',
    '$11,000,000 · 101,300 SF shell · 14+ MW available site power',
    sandstone.acquisition!.listing_url,
    'Broker sale listing describes shell space pending user fitout; available utility capacity is not active demand.',
  ),
];
export const acquisitionSeeds: Facility[] = [ravenna, butler, montana, sandstone];
