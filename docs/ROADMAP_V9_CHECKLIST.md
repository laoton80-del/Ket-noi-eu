# Kết Nối EU V9 - Execution Roadmap (CTO)

## P0 (1-2 days) - Core monetization baseline
- [ ] Wire `Wallet` into stack navigation while keeping 6 bottom tabs unchanged.
- [ ] Introduce global wallet state (`credits`, `lifetimeSpent`).
- [ ] Connect `ComboWalletScreen` to top-up credits flow from real combo cards.
- [ ] Show dynamic credit balance in `CaNhanScreen` (replace static i18n number).
- [ ] Deduct 1 credit per successful voice completion from `useVoiceAI` (Leona/LOAN).
- [ ] Guard behavior when credits are low (message + do not deduct below 0).

## P1 (2-4 days) - AI Eye demo to productized module
- [ ] Add `AiEyeScreen` route and entry point from `HocTapScreen`.
- [ ] Ship Camera/Radar UI mock with scan states (`idle/scanning/done`).
- [ ] Return 3 output blocks (Translation, Knowledge, 3 prompts) via mock provider.
- [ ] Add deterministic test fixtures for vision outputs.
- [ ] Prepare API contract for real GPT-4o Vision integration.

## P2 (4-7 days) - Production AI operations
- [ ] Implement real LOAN inbound workflow: appointments/orders payload + persistence.
- [ ] Build reception dashboard list and status transitions.
- [ ] Integrate Leona stealth-mode runtime in active voice path (not placeholder service).
- [ ] Implement wallet transaction ledger with persistence and history view.
- [ ] Add credit pricing strategy by market currency (Tier 1/2 configurable rules).

## Risks / Dependencies
- OpenAI key and policy gating for STT/TTS/Vision production endpoints.
- Payment provider and ledger consistency for wallet transactions.
- Local persistence strategy (AsyncStorage/MMKV/server source of truth).
