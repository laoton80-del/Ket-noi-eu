export type UserWalletProfile = Readonly<{
  userId: string;
  vigTokenBalance: number;
}>;

/** @deprecated Use `UserWalletProfile.vigTokenBalance`. */
export type LegacyUserWalletProfile = Readonly<{
  userId: string;
  creditBalance?: number;
  coinBalance?: number;
}>;
