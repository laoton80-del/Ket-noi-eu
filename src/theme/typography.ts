/**
 * Primary UI typeface: **Montserrat** (@expo-google-fonts/montserrat) — geometric sans aligned with the Kết Nối Global wordmark.
 * Loaded in `App.tsx` via `useMontserratFonts` before the main tree renders. Use `FontFamily.*` on `Text` / `TextInput`; do not substitute legacy placeholders (e.g. Inter) for product surfaces.
 */
export const FontFamily = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extrabold: 'Montserrat_800ExtraBold',
} as const;
