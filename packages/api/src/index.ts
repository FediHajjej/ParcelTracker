import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { detectCarrier } from './detect';
import { DHLAdapter } from './carriers/dhl';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const adapters: Record<string, any> = {
  dhl: new DHLAdapter(),
};

app.get('/track/:trackingNumber', async (req, res) => {
  const { trackingNumber } = req.params;
  const carrier = detectCarrier(trackingNumber);
  if (!carrier) return res.status(400).json({ error: 'Could not detect carrier' });
  const adapter = adapters[carrier];
  if (!adapter) return res.status(501).json({ error: `Carrier "${carrier}" not yet implemented` });
  try {
    const result = await adapter.track(trackingNumber);
    return res.json(result);
  } catch (err: any) {
    return res.status(502).json({ error: 'Carrier API error', detail: err.message });
  }
});

app.get('/detect/:trackingNumber', (req, res) => {
  res.json({ carrier: detectCarrier(req.params.trackingNumber) });
});

app.listen(3001, () => console.log('API running on http://localhost:3001'));