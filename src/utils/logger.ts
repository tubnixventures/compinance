export interface LogMeta {
  ip?: string;
  country?: string;
  region?: string;
  userId?: string;
  staffId?: string;
  path?: string;
  method?: string;
  status?: number | string;
  [key: string]: any;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message, ...meta }));
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message, ...meta }));
  },
  error(message: string, error?: any, meta?: LogMeta) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        message,
        error: error?.message || String(error),
        ...meta,
      })
    );
  },
  security(event: string, meta?: LogMeta) {
    console.warn(JSON.stringify({ level: 'SECURITY_ALERT', timestamp: new Date().toISOString(), event, ...meta }));
  },
};
