# VIONA SOS Plus — production roadmap (architecture-first)

**Document type:** Roadmap linking **AF.SOS.1** (surface) and **AF.SOS.2** (entitlement/consent/session contracts + local persistence).  
**Truth:** This roadmap describes **staged** readiness. Nothing here claims live PSAP dispatch, automatic emergency calling, or production recording until those layers are implemented, legally cleared, and operationally staffed.

## Principles

1. **VIONA SOS does not replace local emergency services.** Every shipped surface must preserve this line.
2. **Honest maturity labels:** Lite / Pilot / Staged / Requires setup — no cosmetic “production” language without backing systems.
3. **SOS Plus surfaces staged emergency-assist tools only when legally configured** — global positioning for **Vietnamese users worldwide** and travelers; not “VIONA will call police/fire/ambulance automatically” unless that path is built and approved.

## Phase map

| Phase | Scope | Backend | Money | Telecom | Recording |
|-------|-------|---------|-------|---------|-----------|
| **AF.SOS.1** | Product surface, hold gate, info modal | None | None | None | None |
| **AF.SOS.2** (current) | Typed models, **local stub** entitlement, consent profile UI, session record shape, AsyncStorage | None | None | None | None |
| **Next** | Signed entitlement snapshot from server; Stripe SKU linkage; webhook idempotency | Yes | Yes | Optional bridge | Opt-in after consent UX |
| **Later** | Trusted-contact outbound notifications; assisted dial; **verified** country emergency routing matrix + embassy/consulate datasets | Yes | Metered | Twilio or native dialer | Encrypted vault |

## Frontend contracts (AF.SOS.2)

| Artifact | Path | Note |
|----------|------|------|
| Entitlement + consent types | `src/domain/sos/sosPlusModels.ts` | `SosPlusEntitlementSource` today = `local_stub` only |
| Session/event types | `src/domain/sos/sosSessionModels.ts` | `createSosSessionDraft` for future instrumentation |
| Device persistence | `src/services/sos/sosPlusLocalStore.ts` | Replace with server SoT when ready |
| Profile UI | `src/screens/sos/SosPlusProfileScreen.tsx` | Route `SosPlusProfile` |
| UI gate | `src/config/sosPlusProduction.ts` | `SOS_PLUS_PROFILE_UI_ENABLED` |

## Consent domains (stored locally until backend exists)

- Location sharing  
- Audio recording (future activation)  
- Video recording (future activation)  
- Trusted contact alerts  
- Emergency call assistance (future routing assist — **not** auto-dispatch)  
- Legal acknowledgment timestamp  

## Entitlement stub rules

- **Simulate SOS Plus** is a **device-only preview** — must never be interpreted as paid subscription.
- Production entitlement must eventually come from **signed server state** + Stripe subscription object (future).

## Operational gates before “pilot live automation”

- [ ] Legal review per jurisdiction (host countries worldwide + Vietnam diaspora flows — avoid Europe-only framing unless a market filter applies).  
- [ ] DPIA / retention policy for location and recording artifacts.  
- [ ] Abuse / false-positive playbook for voice or keyword flows (future).  
- [ ] Cost caps for telephony and AI assist (Companion OS firewall).  
- [ ] Audit log sink (immutable, tenant-safe) for SOS sessions.

## Related docs

- `docs/product/VIONA_SOS_PLUS_PRODUCT_SPEC.md`  
- `docs/audit/VIONA_AF_SOS_PLUS_SURFACE_AUDIT.md`  
- `docs/audit/VIONA_AF_SOS_PLUS_ENTITLEMENT_CONSENT_AUDIT.md`  

---

**Document control:** Revision with each gate promotion (internal demo → pilot → beta).
