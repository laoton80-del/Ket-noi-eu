/** Semantic roles for the additive hybrid design source. No runtime theme switch. */

export type UniverseId = 'local' | 'travel' | 'academy' | 'business' | 'account' | 'sos';

export type ShadowToken = Readonly<{
  shadowColor: string;
  shadowOffset: Readonly<{ width: number; height: number }>;
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}>;

export type TypeRole = Readonly<{
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}>;
