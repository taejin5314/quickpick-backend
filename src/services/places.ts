import { haversineDistanceKm } from '../utils/distance';
import { generateReason } from '../utils/reason';
import { QuickPickRestaurant, PriceLevel } from '../models/restaurant';

const BASE = 'https://places.googleapis.com/v1';

// ── Google type → cuisine label ──────────────────────────────────────────
const CUISINE_MAP: Record<string, string> = {
  korean_restaurant: 'Korean',
  japanese_restaurant: 'Japanese',
  chinese_restaurant: 'Chinese',
  italian_restaurant: 'Italian',
  american_restaurant: 'American',
  french_restaurant: 'French',
  thai_restaurant: 'Thai',
  vietnamese_restaurant: 'Vietnamese',
  indian_restaurant: 'Indian',
  mexican_restaurant: 'Mexican',
  mediterranean_restaurant: 'Mediterranean',
  pizza_restaurant: 'Pizza',
  hamburger_restaurant: 'Burgers',
  sushi_restaurant: 'Japanese',
  ramen_restaurant: 'Japanese',
  seafood_restaurant: 'Seafood',
  steak_house: 'Steakhouse',
  barbecue_restaurant: 'BBQ',
  vegetarian_restaurant: 'Vegetarian',
  vegan_restaurant: 'Vegan',
  cafe: 'Café',
  coffee_shop: 'Coffee',
  bakery: 'Bakery',
  fast_food_restaurant: 'Fast Food',
  taiwanese_restaurant: 'Taiwanese',
  hot_pot_restaurant: 'Hot Pot',
  dim_sum_restaurant: 'Chinese',
  noodle_restaurant: 'Noodles',
  brunch_restaurant: 'Brunch',
};

// Types that are clearly NOT restaurants — reject places whose primaryType is one of these
const EXCLUDED_PRIMARY_TYPES = new Set([
  'shopping_mall', 'supermarket', 'grocery_store', 'convenience_store',
  'bowling_alley', 'movie_theater', 'amusement_park', 'gym', 'spa',
  'gas_station', 'car_wash', 'car_dealer', 'car_rental', 'car_repair',
  'lodging', 'hotel', 'motel', 'department_store', 'clothing_store',
  'electronics_store', 'furniture_store', 'hardware_store', 'home_goods_store',
  'pet_store', 'shoe_store', 'book_store', 'liquor_store', 'drugstore',
  'pharmacy', 'hospital', 'dentist', 'doctor', 'veterinary_care',
  'airport', 'train_station', 'bus_station', 'parking', 'church',
  'mosque', 'synagogue', 'school', 'university', 'library', 'museum',
  'art_gallery', 'zoo', 'aquarium', 'stadium', 'night_club', 'bar',
  'beauty_salon', 'hair_care', 'laundry', 'bank', 'atm',
  'post_office', 'real_estate_agency', 'travel_agency',
]);

// Types in the place's types[] array that indicate it's NOT primarily a food venue
const NON_FOOD_TYPES = new Set([
  'shopping_mall', 'supermarket', 'grocery_store', 'convenience_store',
  'bowling_alley', 'movie_theater', 'amusement_park', 'gym', 'spa',
  'gas_station', 'lodging', 'hotel', 'department_store',
]);

/** Returns true only if the place looks like an actual restaurant */
function isActualRestaurant(p: GooglePlace): boolean {
  // Reject if primaryType is clearly non-food
  if (p.primaryType && EXCLUDED_PRIMARY_TYPES.has(p.primaryType)) return false;

  const types = p.types ?? [];

  // Accept if primaryType is a known restaurant/food type
  const foodPrimary = p.primaryType && (
    p.primaryType in CUISINE_MAP ||
    p.primaryType === 'restaurant' ||
    p.primaryType === 'food' ||
    p.primaryType === 'meal_delivery' ||
    p.primaryType === 'meal_takeaway'
  );
  if (foodPrimary) return true;

  // Reject if any non-food type is present (shopping_mall with a food court, etc.)
  if (types.some(t => NON_FOOD_TYPES.has(t))) return false;

  // Accept if types contain a known cuisine type or generic restaurant/food
  return types.some(t =>
    t in CUISINE_MAP ||
    t === 'restaurant' ||
    t === 'food' ||
    t === 'meal_delivery' ||
    t === 'meal_takeaway'
  );
}

// ── Known chain detection ─────────────────────────────────────────────────
const CHAINS = new Set([
  "mcdonald's", 'kfc', 'subway', 'pizza hut', "domino's", 'starbucks',
  'burger king', "wendy's", 'chipotle', 'olive garden', "applebee's",
  "chili's", 'ihop', "denny's", 'shake shack', 'five guys', 'taco bell',
  'popeyes', 'chick-fil-a', 'tim hortons', 'dunkin', 'dairy queen',
  "papa john's", 'little caesars', 'panda express', 'panera bread',
]);

// ── Google Places API v1 shape ────────────────────────────────────────────
interface GooglePlace {
  id: string;
  displayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  currentOpeningHours?: { openNow: boolean };
  location?: { latitude: number; longitude: number };
  types?: string[];
  primaryType?: string;
  formattedAddress?: string;
  editorialSummary?: { text: string };
  photos?: Array<{ name: string }>;
  dineIn?: boolean;
  delivery?: boolean;
  takeout?: boolean;
  servesBrunch?: boolean;
  servesBreakfast?: boolean;
  outdoorSeating?: boolean;
}

interface NearbyResponse {
  places?: GooglePlace[];
}

// ── Field masks ───────────────────────────────────────────────────────────
const NEARBY_MASK = [
  'places.id', 'places.displayName', 'places.rating', 'places.userRatingCount',
  'places.priceLevel', 'places.currentOpeningHours', 'places.location',
  'places.types', 'places.primaryType', 'places.formattedAddress',
  'places.photos', 'places.dineIn', 'places.delivery', 'places.takeout',
  'places.servesBrunch', 'places.servesBreakfast', 'places.outdoorSeating',
].join(',');

const DETAIL_MASK = [
  'id', 'displayName', 'rating', 'userRatingCount', 'priceLevel',
  'currentOpeningHours', 'location', 'types', 'primaryType',
  'formattedAddress', 'editorialSummary', 'photos',
  'dineIn', 'delivery', 'takeout', 'servesBrunch', 'servesBreakfast', 'outdoorSeating',
].join(',');

// ── Helpers ───────────────────────────────────────────────────────────────
function cuisine(types: string[], primary?: string): string {
  if (primary && CUISINE_MAP[primary]) return CUISINE_MAP[primary];
  for (const t of types) if (CUISINE_MAP[t]) return CUISINE_MAP[t];
  return 'Restaurant';
}

function priceLevel(google?: string): PriceLevel {
  switch (google) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE': return 1;
    case 'PRICE_LEVEL_MODERATE':    return 2;
    case 'PRICE_LEVEL_EXPENSIVE':   return 3;
    case 'PRICE_LEVEL_VERY_EXPENSIVE': return 4;
    default: return 2;
  }
}

function popularity(rating: number, reviewCount: number): number {
  const rv = Math.min(1, Math.log10(Math.max(reviewCount, 1)) / Math.log10(5000));
  const rt = Math.max(0, (rating - 3.5) / 1.5);
  return Math.round(Math.min(10, (rv * 0.6 + rt * 0.4) * 10));
}

function tags(p: GooglePlace): string[] {
  const t: string[] = [];
  if (p.dineIn)        t.push('Dine-in');
  if (p.delivery)      t.push('Delivery');
  if (p.takeout)       t.push('Takeout');
  if (p.servesBrunch)  t.push('Brunch');
  if (p.outdoorSeating) t.push('Outdoor seating');
  return t.slice(0, 3);
}

function normalize(p: GooglePlace, userLat: number, userLng: number): QuickPickRestaurant {
  const lat = p.location?.latitude ?? userLat;
  const lng = p.location?.longitude ?? userLng;
  const distanceKm = haversineDistanceKm(userLat, userLng, lat, lng);
  const rating = p.rating ?? 3.5;
  const reviewCount = p.userRatingCount ?? 0;
  const price = priceLevel(p.priceLevel);
  const isOpenNow = p.currentOpeningHours?.openNow ?? false;
  const name = p.displayName?.text ?? 'Restaurant';
  const cuis = cuisine(p.types ?? [], p.primaryType);

  const dist = distanceKm < 0.5
    ? `${Math.round(distanceKm * 1000)}m`
    : `${distanceKm.toFixed(1)}km`;

  return {
    id: p.id,
    placeId: p.id,
    categoryId: 'food',
    name,
    cuisine: cuis,
    rating,
    reviewCount,
    distanceKm,
    priceLevel: price,
    isChain: [...CHAINS].some(c => name.toLowerCase().includes(c)),
    isOpenNow,
    latitude: lat,
    longitude: lng,
    address: p.formattedAddress ?? '',
    imageUrl: p.photos?.[0]?.name ?? null,
    photoNames: (p.photos ?? []).slice(0, 6).map(ph => ph.name),
    recommendationReason: generateReason(cuis, rating, reviewCount, distanceKm, price, isOpenNow),
    description: p.editorialSummary?.text
      ?? `A ${cuis.toLowerCase()} restaurant ${dist} from you.`,
    popularityScore: popularity(rating, reviewCount),
    tags: tags(p),
  };
}

// ── Public API ────────────────────────────────────────────────────────────
export async function searchNearby(
  apiKey: string,
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<QuickPickRestaurant[]> {
  const res = await fetch(`${BASE}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': NEARBY_MASK,
    },
    body: JSON.stringify({
      includedTypes: ['restaurant'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API ${res.status}: ${body}`);
  }

  const data = (await res.json()) as NearbyResponse;
  return (data.places ?? [])
    .filter(p => p.location && p.displayName && (p.rating ?? 0) >= 3.0 && isActualRestaurant(p))
    .map(p => normalize(p, lat, lng));
}

export async function getDetails(
  apiKey: string,
  placeId: string,
  userLat: number,
  userLng: number,
): Promise<QuickPickRestaurant> {
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': DETAIL_MASK,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Place Details ${res.status}: ${body}`);
  }

  return normalize((await res.json()) as GooglePlace, userLat, userLng);
}
