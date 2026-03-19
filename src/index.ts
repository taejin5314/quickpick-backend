import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { restaurantsRouter } from './routes/restaurants';

dotenv.config();

if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️  GOOGLE_MAPS_API_KEY is not set. Requests will fail.');
}

const app = express();
const PORT = process.env.PORT ?? 3000;

const origin = process.env.CORS_ORIGIN ?? '*';
app.use(cors({ origin: origin === '*' ? '*' : origin.split(',').map(s => s.trim()), methods: ['GET'] }));
app.use(express.json());

app.use('/api/restaurants', restaurantsRouter);

// Proxy Google Places photos — keeps the API key server-side
app.get('/api/photos/*', (req: express.Request<{ '0': string }>, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) { res.status(500).end(); return; }
  const photoName = decodeURIComponent(req.params['0']);
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`;
  res.redirect(url);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`QuickPick backend → http://localhost:${PORT}`);
});
