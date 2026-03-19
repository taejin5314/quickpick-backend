function fmt(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

export function generateReason(
  cuisine: string,
  rating: number,
  reviewCount: number,
  distanceKm: number,
  priceLevel: number,
  isOpenNow: boolean,
): string {
  const dist =
    distanceKm < 0.5
      ? `${Math.round(distanceKm * 1000)}m`
      : `${distanceKm.toFixed(1)}km`;
  const r = rating.toFixed(1);
  const rv = fmt(reviewCount);

  if (rating >= 4.7 && reviewCount >= 1000) {
    return `One of the highest-rated spots nearby — ${r} stars from ${rv} reviews. A clear crowd favourite.`;
  }
  if (reviewCount >= 2000) {
    return `Trusted by thousands — ${rv} reviews and a solid ${r}. Consistently well-regarded.`;
  }
  if (distanceKm < 0.25 && rating >= 4.2) {
    return `Just ${dist} away with a strong ${r} rating. Best combination of quality and convenience nearby.`;
  }
  if (priceLevel === 1 && rating >= 4.2) {
    return `Budget-friendly with impressive quality — ${r} stars from ${rv} reviews. Exceptional value.`;
  }
  if (isOpenNow && rating >= 4.4) {
    return `Open now and consistently rated ${r} across ${rv} reviews. A reliable choice tonight.`;
  }
  if (rating >= 4.5) {
    return `Highly rated at ${r} with ${rv} reviews. One of the stronger ${cuisine} options nearby.`;
  }
  return `Rated ${r} across ${rv} reviews. A well-regarded ${cuisine.toLowerCase()} option ${dist} from you.`;
}
