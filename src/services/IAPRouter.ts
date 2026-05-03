/**
 * **Pillar 5 — Market protections:** routes **digital SaaS / VIG** spend away from IAP (30% Apple tax) toward
 * **external Stripe** (Customer Portal / hosted checkout). Physical marketplace services stay in-app per policy.
 *
 * @see Implementation — `src/services/billing/IAPRouter.ts`
 */
export {
  billingGatewayForPlanPurchase,
  determineBillingGateway,
  isAppStoreReviewMode,
  type BillingGatewayDecision,
  type BillingGatewayKind,
  type BillingItemType,
} from './billing/IAPRouter';
