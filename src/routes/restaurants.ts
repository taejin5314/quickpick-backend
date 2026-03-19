import { Router, Request, Response } from 'express';
import { searchNearby, getDetails } from '../services/places';

export const restaurantsRouter = Router();

restaurantsRouter.get('/nearby', async (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfiguration: missing API key' });
    return;
  }

  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || 5000;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'lat and lng query params are required' });
    return;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Invalid coordinates' });
    return;
  }

  try {
    const base = `${req.protocol}://${req.get('host')}`;
    const restaurants = await searchNearby(apiKey, lat, lng, Math.min(radius, 10000));
    const mapped = restaurants.map(r => {
      const photoUrls = r.photoNames.map(n => `${base}/api/photos/${encodeURIComponent(n)}`);
      return { ...r, imageUrl: photoUrls[0] ?? null, photoUrls };
    });
    res.json({ restaurants: mapped, location: { lat, lng } });
  } catch (err) {
    console.error('[/nearby]', err);
    res.status(503).json({ error: 'Failed to fetch restaurants' });
  }
});

restaurantsRouter.get('/:placeId', async (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfiguration: missing API key' });
    return;
  }

  const { placeId } = req.params;
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'lat and lng query params are required' });
    return;
  }

  try {
    const base = `${req.protocol}://${req.get('host')}`;
    const r = await getDetails(apiKey, placeId, lat, lng);
    const photoUrls = r.photoNames.map(n => `${base}/api/photos/${encodeURIComponent(n)}`);
    const restaurant = { ...r, imageUrl: photoUrls[0] ?? null, photoUrls };
    res.json({ restaurant });
  } catch (err) {
    console.error('[/:placeId]', err);
    res.status(503).json({ error: 'Failed to fetch restaurant details' });
  }
});
