export interface AuditLog {
  id: string;
  timestamp: number;
  actorId?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip: string;
  country: string;
  region: string;
  status: 'SUCCESS' | 'REJECTED' | 'FAILED';
  metadata?: Record<string, any>;
}

export interface GeoLocation {
  ip: string;
  country: string; // Must be 'KE' for Kenya
  region: string;
  city?: string;
  isVpnOrProxy?: boolean;
}
