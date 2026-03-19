// Fetches a food photo URL for a cuisine type using Google Custom Search API.
// Results are cached per cuisine (promise cache prevents duplicate in-flight requests).

const CUISINE_QUERIES: Record<string, string> = {
  Korean:        'korean food bibimbap bulgogi',
  Japanese:      'japanese food sushi ramen',
  Chinese:       'chinese food dim sum noodles',
  Italian:       'italian food pasta pizza',
  American:      'american food burger steak',
  French:        'french food cuisine dish',
  Thai:          'thai food pad thai curry',
  Vietnamese:    'vietnamese food pho banh mi',
  Indian:        'indian food curry dish',
  Mexican:       'mexican food tacos dish',
  Mediterranean: 'mediterranean food dish',
  Pizza:         'pizza dish food',
  Burgers:       'burger food dish',
  Seafood:       'seafood dish food',
  Steakhouse:    'steak dish food',
  BBQ:           'bbq grilled meat food',
  Vegetarian:    'vegetarian food dish',
  Vegan:         'vegan food dish',
  Café:          'cafe coffee pastry food',
  Coffee:        'coffee drink cafe food',
  Bakery:        'bakery bread pastry food',
  'Fast Food':   'fast food burger fries',
  Taiwanese:     'taiwanese food dish',
  'Hot Pot':     'hot pot food dish',
  Noodles:       'noodle dish food',
  Brunch:        'brunch food dish eggs',
};

interface SearchResult {
  items?: Array<{ link: string }>;
}

const cache = new Map<string, Promise<string | null>>();

async function fetchFromGoogle(cuisine: string, apiKey: string, cx: string): Promise<string | null> {
  const query = encodeURIComponent(CUISINE_QUERIES[cuisine] ?? `${cuisine} food dish`);
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&searchType=image&num=1&imgType=photo&imgSize=large&safe=active`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[cuisinePhoto] Custom Search API ${res.status} for cuisine "${cuisine}"`);
      return null;
    }
    const data = (await res.json()) as SearchResult;
    return data.items?.[0]?.link ?? null;
  } catch (err) {
    console.error(`[cuisinePhoto] fetch failed for "${cuisine}":`, err);
    return null;
  }
}

export function getCuisinePhotoUrl(cuisine: string, apiKey: string, cx: string): Promise<string | null> {
  if (!cache.has(cuisine)) {
    cache.set(cuisine, fetchFromGoogle(cuisine, apiKey, cx));
  }
  return cache.get(cuisine)!;
}
