import { useCallback, useEffect, useState } from 'react';
import { loadVaultDocuments } from '../services/DocumentAlarmService';

export function useNearestVaultExpiry(isFocused: boolean): string | null {
  const [nearestVaultExpiryDate, setNearestVaultExpiryDate] = useState<string | null>(null);

  const refreshNearestVaultExpiry = useCallback(() => {
    let mounted = true;
    void (async () => {
      try {
        const docs = await loadVaultDocuments();
        const sorted = docs
          .filter((d) => !!d.expiryDate)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        if (!mounted) return;
        setNearestVaultExpiryDate(sorted[0]?.expiryDate ?? null);
      } catch {
        if (!mounted) return;
        setNearestVaultExpiryDate(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    return refreshNearestVaultExpiry();
  }, [isFocused, refreshNearestVaultExpiry]);

  useEffect(() => {
    if (!isFocused) return;
    const timer = setInterval(() => {
      refreshNearestVaultExpiry();
    }, 20000);
    return () => clearInterval(timer);
  }, [isFocused, refreshNearestVaultExpiry]);

  return nearestVaultExpiryDate;
}
