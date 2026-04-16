export type CarrierName = 'dhl' | 'dpd' | 'hermes' | 'gls' | 'ups' | 'fedex' | 'amazon' | 'dpost';
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
}