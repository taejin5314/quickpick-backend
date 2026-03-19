export type PriceLevel = 1 | 2 | 3 | 4;

export interface QuickPickRestaurant {
  id: string;
  placeId: string;
  categoryId: 'food';
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  priceLevel: PriceLevel;
  isChain: boolean;
  isOpenNow: boolean;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl: string | null;
  photoNames: string[];
  recommendationReason: string;
  description: string;
  popularityScore: number;
  tags: string[];
}
