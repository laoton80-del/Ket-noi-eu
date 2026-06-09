# VIONA Route Capability Inventory

## Purpose

This inventory exists so VIONA can move toward Global Active / Full Production without losing universes, routes, mini-apps, or safety-critical capabilities during cleanup waves.

The canonical command is:

```bash
node scripts/viona-route-capability-inventory.mjs
```

The script is read-only. It inspects route definitions, stack/tab registrations, route-linked screens, and component files that reference route names. It does not mutate runtime files, navigation, i18n, payment, SOS, wallet, auth, AI, DB, Prisma, or assets.

## Classifications

Readiness labels are internal production-readiness signals only:

| Label | Meaning |
| --- | --- |
| Full | Backing system and operations are verified for the claimed production behavior. |
| Lite | Narrow active surface with explicitly limited behavior. |
| Pilot | Operationally restricted path with owner/manual ops expectations. |
| Demo | Simulation, mock, local-only, debug, or evidence surface. |
| Beta | User-facing but still under launch constraints. |
| Preview | Review, lab, or operating-preview surface. |
| Coming Soon | Capability is intentionally present but not active. |
| Gated | Feature flag, workspace, role, or safety gate controls entry. |
| Unknown | Static extraction could not prove the current readiness label. |

Universe labels follow the north-star platform shape:

| Universe | Scope |
| --- | --- |
| Home | Global Command Center, LifeOS, launch and orchestration surfaces. |
| Local | Local services, nearby merchant/customer interaction, local request flows. |
| Travel | Travel companion, Vietnam inbound, hospitality, fixer, flight, and trip utility surfaces. |
| Academy | Learning, kids, adult lessons, teacher, and practice loops. |
| Business | Merchant, broker, partner, ads, receptionist, and operations surfaces. |
| Account | Profile, onboarding, rewards, wallet-adjacent personal surfaces. |
| SOS | Global Lifeline, emergency guidance, safety consent and SOS profiles. |
| B2B Wholesale / E-shop Import | Merchant wholesale, catalog import, supplier trade, and order-ticket capability. |

Capability classes:

| Capability | Examples |
| --- | --- |
| Consumer UI | Home, Local, Travel, hub and mini-app surfaces. |
| Merchant/B2B | Merchant dashboard, catalog, orders, broker, partner, wholesale. |
| AI | Leona, receptionist, interpreter, teacher, voice or autonomous assistant surfaces. |
| Payment/wallet | Wallet, checkout, cash out, payout, billing, VIO/VIG credits. |
| Booking/request | Booking, request, inbox, calendar, order and confirmation surfaces. |
| SOS/safety | SOS, Emergency, Lifeline, trusted contact, medical/police guidance. |
| Academy/learning | Adult learning, kids learning, teacher and practice flows. |
| Travel utility | Flight, hospitality, fixer, Vietnam hub and travel support. |
| Account/profile | Login, OTP, role selection, setup profile, Personal Hub. |
| Docs/evidence/admin | Admin debug, audit, CRM, war room and evidence surfaces. |

Risk flags:

| Flag | Why it matters |
| --- | --- |
| payment-like | Must not imply captured payment, settlement, refund, payout, cash-out, wallet balance truth, or guaranteed money movement. |
| booking mutation | Must not imply confirmed booking, reserved inventory, provider guarantee, or server-side mutation unless backed. |
| emergency/SOS | Must not imply dispatch, authority contact, GPS sharing, recording, or live response without approved systems and consent. |
| AI action | Must not imply autonomous calls, booking, payment, cancellation, settlement, or protected mutation without explicit gates. |
| legal/medical | Must not imply official legal, medical, tax, government, diagnosis, or certification outcomes. |
| auth/session | Must preserve login, OTP, profile, JWT, and account integrity expectations. |
| tenant/merchant | Must preserve workspace, merchant ownership, supplier, catalog, and tenant boundaries. |

## Do Not Remove Capability Rule

Do not remove a route, mini-app, or universe because the current implementation is Lite, Pilot, Demo, Beta, Preview, Coming Soon, Gated, or Unknown.

Removal is allowed only when a product owner and architect explicitly retire the capability from the VIONA blueprint. Dirty UI, incomplete ops, missing translations, or blocked payment/SOS/AI automation are readiness gaps, not permission to erase platform scope.

## Gate Instead Of Delete Rule

When a capability is not ready for live production:

1. Keep the route/capability in the inventory.
2. Gate the production behavior.
3. Label the surface honestly as Lite, Pilot, Demo, Beta, Preview, Coming Soon, Gated, or Unknown.
4. Preserve safe read-only preview/demo flows where useful.
5. Require owner signoff before enabling payment, SOS live calling, AI mutation, booking mutation, wallet settlement, tenant mutation, auth changes, or DB migration.

## What To Do When Findings Appear

If the script marks a route high risk or unknown:

1. Keep the capability.
2. Confirm whether the route is visible tab, stack/hidden, admin-gated, or typed-only.
3. Add or verify an internal readiness label.
4. If production systems are not live, gate the outcome as Lite, Demo, Pilot, Beta, Coming Soon, or Preview.
5. Never fake payment, SOS dispatch, AI autonomy, booking confirmation, wallet settlement, tenant isolation, legal/medical advice, or official certification.
6. Assign an owner/manual ops requirement before promotion.

## Next Production-Readiness Steps

1. Run the inventory script before route cleanup, navigation refactors, C2A visual packs, or production-readiness import packs.
2. Review high-risk routes first: payment/wallet, booking/request, SOS, AI action, auth/session, and tenant/merchant flags.
3. Convert Unknown readiness labels into explicit internal labels in docs or gated copy.
4. Cross-check the output with the fake-production claims checker.
5. Produce an owner matrix for every high-risk universe before moving a surface from Demo/Pilot/Lite to Beta/Full.
6. Keep B2B Wholesale / E-shop Import visible in planning even when the implementation is gated or partial.
