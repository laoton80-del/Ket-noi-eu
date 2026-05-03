export type ServiceResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: string; status: number; unreachable?: boolean }>;
