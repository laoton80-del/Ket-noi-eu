export function generateChargeKey(serviceId: string): string {
  const normalized = serviceId.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'service';
  const ts = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `${normalized}_${ts}_${random}`;
}
