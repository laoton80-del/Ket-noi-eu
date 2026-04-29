# CUTOVER BLOCKERS — Go/No-Go (Second Pass)

## [P0 - CRITICAL LAUNCH BLOCKER]

- [x] **File:** `src/components/commercial/PaymentCheckoutSheet.tsx`  
  **Violation:** Checkout marks payment as successful after a fixed client-side delay (`setTimeout`) without server receipt/ledger confirmation, violating Trust-first.  
  **Fix snippet/command:** Replace simulated success path with backend verification gate before setting success UI:
  ```ts
  // remove:
  // await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
  // setIsSuccess(true);
  //
  // require:
  const result = await verifyPurchaseReceipt(realReceipt, platform, 'checkout');
  if (!result.ok) return;
  await syncWalletFromServer();
  setIsSuccess(true);
  ```

- [x] **File:** `src/components/commercial/PaymentCheckoutSheet.web.tsx`  
  **Violation:** Web checkout also fakes completion via timeout and success banner without any authoritative payment result.  
  **Fix snippet/command:** Enforce same server-authoritative flow as native:
  ```ts
  const result = await verifyPurchaseReceipt(realReceipt, 'web', 'checkout');
  if (!result.ok) return;
  await syncWalletFromServer();
  setIsSuccess(true);
  ```

- [x] **File:** `src/screens/commercial/GlobalWalletScreen.tsx`  
  **Violation:** Wallet displays `MOCK_BALANCE` and `MOCK_TRANSACTIONS` as primary truth, which violates server-authoritative money/ledger doctrine.  
  **Fix snippet/command:** Remove mocks and bind UI to wallet server snapshot:
  ```ts
  // remove:
  // const MOCK_BALANCE = 5000;
  // const MOCK_TRANSACTIONS = [...]
  //
  // require:
  const wallet = useWalletState();
  useEffect(() => { void syncWalletFromServer(); }, []);
  // render wallet.credits + server-backed transaction feed
  ```

## [P1 - HIGH PRIORITY FIX]

- [x] **File:** `src/screens/AssistantChatScreen.tsx`  
  **Violation:** Contains literal hex colors (`#F8F9FA`, `#0B1628`) and non-token spacing values (`16`, `12`), violating 10/10 token strictness.  
  **Fix snippet/command:**
  ```ts
  // replace examples:
  backgroundColor: '#F8F9FA' -> backgroundColor: theme.colors.SoftMineralGrey
  shadowColor: '#0B1628' -> shadowColor: theme.colors.background
  padding: 16 -> padding: theme.spacing.lg
  gap: 12 -> gap: theme.spacing.md
  ```

- [x] **File:** `src/screens/b2b/InboundQueueScreen.tsx`  
  **Violation:** B2B parity/adaptive rule is incomplete because this screen uses `SafeAreaView + ScrollView` directly and does not use `AdaptiveContainer` like peer B2B surfaces.  
  **Fix snippet/command:**
  ```ts
  import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
  import { useDeviceLayout } from '../../hooks/useDeviceLayout';

  // wrap main content:
  <SafeAreaView style={styles.container}>
    <AdaptiveContainer contentStyle={styles.content}>
      {/* existing queue content */}
    </AdaptiveContainer>
  </SafeAreaView>
  ```

---

**CUTOVER STATUS: GREEN LIGHT**

