import axios from 'axios';

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
}