const fs = require('fs');

fs.writeFileSync('package.json', JSON.stringify({
  name: "parceltracker",
  private: true,
  workspaces: ["packages/*"],
  scripts: {
    dev: "concurrently \"npm run dev -w packages/api\" \"npm run dev -w packages/web\"",
    build: "npm run build -w packages/api && npm run build -w packages/web"
  },
  devDependencies: { concurrently: "^8.2.2" }
}, null, 2));

fs.writeFileSync('.gitignore', 'node_modules/\ndist/\n.env\n*.env\n');

fs.writeFileSync('packages/api/package.json', JSON.stringify({
  name: "@parceltracker/api",
  version: "1.0.0",
  scripts: {
    dev: "tsx watch src/index.ts",
    build: "tsc"
  },
  dependencies: {
    express: "^4.18.2",
    cors: "^2.8.5",
    axios: "^1.6.0",
    cheerio: "^1.0.0",
    dotenv: "^16.3.1"
  },
  devDependencies: {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.0.0",
    typescript: "^5.3.0",
    tsx: "^4.7.0"
  }
}, null, 2));

fs.writeFileSync('packages/api/tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: "ES2022",
    module: "CommonJS",
    rootDir: "src",
    outDir: "dist",
    strict: true,
    esModuleInterop: true,
    resolveJsonModule: true
  }
}, null, 2));

fs.writeFileSync('packages/core/src/types.ts', `export type CarrierName = 'dhl' | 'dpd' | 'hermes' | 'gls' | 'ups' | 'fedex' | 'amazon' | 'dpost';
export type TrackingStatus = 'in_transit' | 'delivered' | 'out_for_delivery' | 'exception' | 'pending' | 'unknown';

export interface TrackingEvent {
  timestamp: string;
  location: string;
  description: string;
  status: TrackingStatus;
}

export interface TrackingResult {
  trackingNumber: string;
  carrier: CarrierName;
  status: TrackingStatus;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

export interface CarrierAdapter {
  name: CarrierName;
  track(trackingNumber: string): Promise<TrackingResult>;
}`);

fs.writeFileSync('packages/api/src/detect.ts', `const CARRIERS = [
  { name: 'amazon', regex: /^TBA\\d{12}$/i },
  { name: 'dhl',    regex: /^(JJD|00340|JVGL|JD)/i },
  { name: 'dhl',    regex: /^\\d{20}$/ },
  { name: 'dpost',  regex: /^RR\\d{8}DE$/i },
  { name: 'ups',    regex: /^1Z[A-Z0-9]{16}$/i },
  { name: 'hermes', regex: /^H\\d{19}$/i },
  { name: 'gls',    regex: /^(\\d{8}|GLS\\d+)$/i },
  { name: 'dpd',    regex: /^\\d{14}$/ },
  { name: 'fedex',  regex: /^\\d{12}(\\d{3})?$/ },
];

export function detectCarrier(raw: string): string | null {
  const clean = raw.trim().toUpperCase().replace(/\\s+/g, '');
  for (const { name, regex } of CARRIERS) {
    if (regex.test(clean)) return name;
  }
  return null;
}`);

fs.writeFileSync('packages/api/src/carriers/dhl.ts', `import axios from 'axios';

const STATUS_MAP: Record<string, string> = {
  transit: 'in_transit',
  delivered: 'delivered',
  'out-for-delivery': 'out_for_delivery',
  failure: 'exception',
  unknown: 'unknown',
};

export class DHLAdapter {
  name = 'dhl' as const;
  private apiKey = process.env.DHL_API_KEY ?? '';

  async track(trackingNumber: string) {
    const res = await axios.get('https://api-eu.dhl.com/track/shipments', {
      params: { trackingNumber },
      headers: { 'DHL-API-Key': this.apiKey },
    });
    const shipment = res.data.shipments?.[0];
    if (!shipment) throw new Error('No shipment data from DHL');
    return {
      trackingNumber,
      carrier: 'dhl' as const,
      status: STATUS_MAP[shipment.status?.status ?? 'unknown'] ?? 'unknown',
      estimatedDelivery: shipment.estimatedTimeOfDelivery,
      events: (shipment.events ?? []).map((e: any) => ({
        timestamp: e.timestamp,
        location: e.location?.address?.addressLocality ?? '',
        description: e.description,
        status: STATUS_MAP[e.status] ?? 'unknown',
      })),
    };
  }
}`);

fs.writeFileSync('packages/api/src/index.ts', `import express from 'express';
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
  if (!adapter) return res.status(501).json({ error: \`Carrier "\${carrier}" not yet implemented\` });
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

app.listen(3001, () => console.log('API running on http://localhost:3001'));`);

fs.writeFileSync('packages/api/.env', 'DHL_API_KEY=your_key_here\n');

console.log('Done! All files created.');