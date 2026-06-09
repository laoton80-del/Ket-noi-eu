# VIONA Universe Capability Map

## Non-Removal Guard

VIONA is a Global Vietnamese Companion OS and Super App Mini-App Platform. Routes and capabilities are not deleted just because they are not production-ready today.

Rule: gate instead of delete. If a capability is incomplete, keep it mapped, label its readiness honestly, and block the unsafe live behavior until the required systems, owners, and runbooks exist.

## Universe Map

| Universe | Current route/screen families to preserve | Capability classes | Primary risk flags |
| --- | --- | --- | --- |
| Home | `Tabs`, `TabHome`, `HomeScreen`, `LifeOSDashboard`, `DashboardB2CPreview`, `KetNoiYeuThuong` | Consumer UI, Account/profile, Docs/evidence/admin where previews are used | auth/session if profile-linked, payment-like if wallet/reward CTAs are present |
| Local | `TabLocal`, `LocalUniverse`, `LocalUserRequestStatus`, `MerchantDetail`, `MerchantStorefront`, `LocalMerchantRequestInbox` | Consumer UI, Merchant/B2B, Booking/request, Account/profile | booking mutation, tenant/merchant, auth/session |
| Travel | `TabTravel`, `TravelHub`, `TravelCompanion`, `VietnamHub`, `TourismCheckout`, `TourismBookingConfirmed`, `ViralWrap`, `TravelFlightSearch`, `FlightSearchAssistant`, `TravelHospitality`, `LocalFixer`, `LocalFixerCheckout`, `FixerEarnings` | Consumer UI, Travel utility, Booking/request, AI, Payment/wallet | payment-like, booking mutation, AI action, tenant/merchant |
| Academy | `TabAi`, `AdultLearningHome`, `KidsLearningHome`, `VietKids`, `KidsLeaderboard`, `LiveAiTeacher` | Academy/learning, AI, Consumer UI | AI action, legal/medical only if credential or diagnosis claims appear |
| Business | `TabMerchant`, `TabCatalog`, `TabOrders`, `TabEarnings`, `MerchantDashboard`, `B2BPaywall`, `InboundQueue`, `SmartCalendar`, `WalletB2B`, `AdBidding`, `PromoTools`, `B2BPromotionSettings`, `SponsoredAds`, `KOLPartnerDashboard`, `PartnerOnboarding`, broker tabs | Merchant/B2B, Payment/wallet, Booking/request, AI, Docs/evidence/admin | tenant/merchant, payment-like, booking mutation, AI action, auth/session |
| Account | `PersonalHub`, `Wallet`, `ReferralReward`, `CashOut`, `DailyReward`, `LoyaltyRewards`, `Vault`, `Login`, `Otp`, `RoleSelection`, `SetupProfile` | Account/profile, Payment/wallet, Consumer UI | payment-like, auth/session, legal/medical where vault/tax copy appears |
| SOS | `EmergencySOS`, `SosPlusProfile`, `TravelSosHub`, global SOS header/modal entry | SOS/safety, Travel utility, Account/profile, AI when TTS/helper copy appears | emergency/SOS, legal/medical, AI action, auth/session |
| B2B Wholesale / E-shop Import | `Orders`, `InternalTradeMarket`, `TabCatalog`, merchant catalog/order-ticket surfaces, supplier trade planning docs | Merchant/B2B, Booking/request, Payment/wallet, AI, Docs/evidence/admin | tenant/merchant, payment-like, booking mutation, AI action |
| Admin / Evidence | `TabCommandCenter`, `AdminDashboard`, `LocalOpsAudit`, `AdminProfitDashboard`, `SalesLeadCRM`, `AdContentFactory`, `OutboundCampaign`, `FacebookWarRoom`, `MarketingApproval` | Docs/evidence/admin, Merchant/B2B, AI | tenant/merchant, AI action, payment-like if revenue dashboards are shown |

## Capability Preservation Rules

1. Home remains the Global Command Center and universe launcher. It must not be reduced to a demo splash page.
2. Local remains a services and request universe. Broken visual polish is not permission to remove request, merchant, or storefront capability.
3. Travel remains a travel companion universe. Payment or booking risk should be gated, not erased.
4. Academy remains part of the global platform. AI teacher surfaces need AI safety labels before live claims.
5. Business remains a merchant and B2B operating universe. Tenant, workspace, billing, catalog, and order flows require explicit gates.
6. Account remains the identity, profile, rewards, wallet-adjacent and personal hub layer. Wallet or cash-out truth must not be faked.
7. SOS remains Global Lifeline. It must not imply dispatch, GPS sharing, authorities contacted, recording, or live emergency response without approved systems and consent.
8. B2B Wholesale / E-shop Import remains strategic platform scope. Catalog import, supplier availability, stock, MOQ, pricing, delivery, settlement, refund, and compliance must not be invented.

## Production-Readiness Sequence

1. Run `node scripts/viona-route-capability-inventory.mjs`.
2. Review all HIGH risk rows before import packs.
3. Run the forbidden claims checker before changing user-visible copy.
4. Add or update docs/runbooks for any route moving toward Pilot, Beta, or Full.
5. Require owner signoff for payment/wallet, SOS, AI action, auth/session, booking/request, and tenant/merchant changes.
6. Use feature/workspace/role gates for unfinished or safety-sensitive behavior.
7. Import visual/runtime packs only after the route and capability map confirms no universe was accidentally removed.
