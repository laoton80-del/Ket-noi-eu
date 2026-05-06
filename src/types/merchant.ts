export type Merchant = Readonly<{
  id: string;
  name: string;
  /** Creation timestamp (UTC source of truth). */
  createdAt: Date;
  /** Free TOP tier flag for honeymoon campaign state. */
  isFreeTopTierActive: boolean;
  /** UTC expiration timestamp for free TOP tier period. */
  freeTopTierExpiresAt: Date;
}>;

export type HoneymoonCheckpointDay = 83 | 87 | 89;
