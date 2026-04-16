/**
 * Static guardrails: `commercialFlagshipMapping.ts` vs COMMERCIAL_FLAGSHIP_DOCTRINE (semantic only).
 *
 * Run from repo root: `npm run check:commercial-mapping`
 * No network, backend, Functions, or billing runtime.
 */
import process from 'node:process';
import {
  ALL_PACKAGE_TIERS,
  BACKBONE_SERVICE_KEYS,
  BACKBONE_SERVICE_MAPPINGS,
  B2B_COMMERCIAL_TIERS,
  INTERNAL_METER_KEYS,
  PUBLIC_OFFER_KEYS,
  STANDARD_PLUS_TIERS,
  getBackboneMapping,
  getOfferDefinition,
  listOfferDefinitions,
  type BackboneServiceKey,
  type PackageTierKey,
  type ProductionRolloutStatus,
  type PublicOfferKey,
} from '../src/config/commercialFlagshipMapping';
import {
  B2C_COMMERCIAL_OFFER_KEYS,
  getB2COfferAccess,
  getB2COffersForPackage,
  isOfferVisibleForPackage,
} from '../src/config/commercialEntitlementSurface';

const errors: string[] = [];

function expect(cond: boolean, msg: string) {
  if (!cond) errors.push(msg);
}

function assertSameSorted<T extends string>(a: readonly T[], b: readonly T[], label: string) {
  expect(
    JSON.stringify([...a].sort()) === JSON.stringify([...b].sort()),
    `${label}: got [${[...a].sort()}], expected [${[...b].sort()}]`
  );
}

function assertStructure() {
  const requiredOffers: PublicOfferKey[] = [
    'ai_teacher',
    'ai_support',
    'ai_document',
    'call_help',
    'business_ops',
  ];
  assertSameSorted(PUBLIC_OFFER_KEYS, requiredOffers, 'PUBLIC_OFFER_KEYS must list exactly five public offers');

  const requiredMeters = [
    'learning_minutes',
    'support_minutes',
    'assistant_actions',
    'document_pages',
    'b2b_operational_volume',
  ] as const;
  assertSameSorted(INTERNAL_METER_KEYS, requiredMeters, 'INTERNAL_METER_KEYS');

  const requiredTiers: PackageTierKey[] = ['starter', 'basic', 'standard', 'pro', 'power', 'enterprise'];
  assertSameSorted(ALL_PACKAGE_TIERS, requiredTiers, 'ALL_PACKAGE_TIERS');
}

function assertDoctrineInvariants() {
  const d = (k: PublicOfferKey) => getOfferDefinition(k);

  expect(d('ai_teacher').domain === 'learning', 'Expected ai_teacher domain to be learning');
  expect(d('business_ops').domain === 'b2b', 'Expected business_ops domain to be b2b');

  for (const k of ['ai_support', 'ai_document', 'call_help'] as const) {
    expect(d(k).domain !== 'learning', `Expected ${k} domain not to be learning`);
  }

  const gemini = getBackboneMapping('gemini_teacher_live');
  expect(gemini?.primaryPublicOffer === 'ai_teacher', 'Expected gemini_teacher_live primaryPublicOffer to be ai_teacher');

  const sos = getBackboneMapping('sos');
  expect(sos?.primaryPublicOffer === 'ai_support', 'Expected sos primaryPublicOffer to be ai_support (B2C support bucket)');
  const sosText = `${sos?.notes ?? ''} ${d('ai_support').guardrails ?? ''}`.toLowerCase();
  expect(
    /free-controlled|miễn phí|kiểm soát|guardrail|controlled/.test(sosText),
    'Expected SOS notes or ai_support guardrails to mention free-controlled style guard (kiểm soát / guardrail / controlled)'
  );

  const flight = getBackboneMapping('flight_assistant');
  expect(flight?.primaryPublicOffer === 'ai_support', 'Expected flight_assistant primary offer to be ai_support (B2C)');
  const fn = flight?.notes ?? '';
  expect(
    /free brief|paid deep|miễn phí|trả phí/i.test(fn),
    'Expected flight_assistant notes to mention free brief / paid deep (or VI equivalent)'
  );
}

function assertPackageEligibility() {
  const ops = getOfferDefinition('business_ops');
  for (const low of ['starter', 'basic'] as const) {
    expect(
      !ops.includedFromPackages.includes(low) && !ops.addOnEligible.includes(low),
      `Expected business_ops not to list tier ${low} in included/add-on`
    );
  }

  assertSameSorted(B2B_COMMERCIAL_TIERS, ['pro', 'power', 'enterprise'], 'B2B_COMMERCIAL_TIERS must be pro+ (doctrine B2B from Pro)');

  const teacher = getOfferDefinition('ai_teacher');
  for (const low of ['starter', 'basic'] as const) {
    expect(
      !teacher.includedFromPackages.includes(low) && !teacher.addOnEligible.includes(low),
      `Expected ai_teacher (Standard+ neo) not to list ${low} in included/add-on`
    );
  }
  assertSameSorted(teacher.includedFromPackages, [...STANDARD_PLUS_TIERS], 'ai_teacher includedFromPackages must match STANDARD_PLUS_TIERS');
  assertSameSorted(teacher.addOnEligible, [...STANDARD_PLUS_TIERS], 'ai_teacher addOnEligible must match STANDARD_PLUS_TIERS');
}

function assertOffersHaveMeters() {
  for (const k of PUBLIC_OFFER_KEYS) {
    const o = getOfferDefinition(k);
    expect(o.internalMeters.length > 0, `Expected offer ${k} to declare at least one internalMeter`);
  }
}

function assertBackboneMappings() {
  const offerSet = new Set<PublicOfferKey>(PUBLIC_OFFER_KEYS);
  const keysFromRows = BACKBONE_SERVICE_MAPPINGS.map((m) => m.key);
  assertSameSorted(keysFromRows, [...BACKBONE_SERVICE_KEYS], 'BACKBONE_SERVICE_MAPPINGS keys must match BACKBONE_SERVICE_KEYS');

  const learningKeys = ['learning_core', 'role_play', 'speaking_practice', 'gemini_teacher_live'] as const;
  for (const k of learningKeys) {
    expect(
      getBackboneMapping(k)?.primaryPublicOffer === 'ai_teacher',
      `Expected backbone ${k} to map only to ai_teacher (learning)`
    );
  }

  const b2bKeys = [
    'smart_reception',
    'inbound_ops',
    'queue_management',
    'handoff',
    'booking_order_state',
    'qualification_fulfillment',
    'billing_operational_truth',
  ] as const satisfies readonly BackboneServiceKey[];
  for (const k of b2bKeys) {
    expect(
      getBackboneMapping(k)?.primaryPublicOffer === 'business_ops',
      `Expected backbone ${k} to map to business_ops`
    );
  }

  for (const m of BACKBONE_SERVICE_MAPPINGS) {
    if (m.primaryPublicOffer != null) {
      expect(offerSet.has(m.primaryPublicOffer), `Backbone ${m.key}: invalid primaryPublicOffer`);
    }
    for (const alt of m.alternatePublicOffers ?? []) {
      expect(offerSet.has(alt), `Backbone ${m.key}: invalid alternatePublicOffers entry`);
    }
  }
}

function assertSurfaceHints() {
  const doc = getOfferDefinition('ai_document');
  expect(
    doc.relatedSurfaces.some((s) => /document/i.test(s.path)),
    'Expected ai_document relatedSurfaces to include a document-related path'
  );
  const call = getOfferDefinition('call_help');
  expect(
    call.relatedSurfaces.some((s) => /leona|call/i.test(s.path)),
    'Expected call_help relatedSurfaces to include a call-related path'
  );
  const biz = getOfferDefinition('business_ops');
  expect(
    biz.relatedSurfaces.some((s) => /b2b|letan/i.test(s.path)),
    'Expected business_ops relatedSurfaces to include b2b or LeTan surface'
  );

  for (const o of listOfferDefinitions()) {
    expect(o.doctrineRefs.length > 0, `Expected offer ${o.key} to list doctrineRefs`);
    expect(o.notes.trim().length > 0, `Expected offer ${o.key} to have non-empty notes`);
    expect(o.label.trim().length > 0, `Expected offer ${o.key} to have non-empty label`);
    expect(o.doctrineSection.trim().length > 0, `Expected offer ${o.key} to have non-empty doctrineSection`);
    expect(o.guardrails.trim().length > 0, `Expected offer ${o.key} to have non-empty guardrails`);
  }
}

function assertProductionStatus() {
  const allowed: readonly ProductionRolloutStatus[] = ['active', 'pilot', 'planned'];
  for (const o of listOfferDefinitions()) {
    expect(allowed.includes(o.productionStatus), `Offer ${o.key}: productionStatus must be active|pilot|planned`);
  }
  expect(getOfferDefinition('ai_teacher').productionStatus !== 'active', 'Expected ai_teacher not hardcoded active (conservative: pilot/planned)');
  expect(getOfferDefinition('business_ops').productionStatus !== 'active', 'Expected business_ops not hardcoded active (conservative: pilot/planned)');
}

function assertB2CEntitlementSurfaceCoherence() {
  for (const k of B2C_COMMERCIAL_OFFER_KEYS) {
    const row = getB2COfferAccess(k);
    const def = getOfferDefinition(k);
    expect(def.domain === 'b2c', `B2C surface offer ${k} must have domain b2c in mapping`);
    expect(row.productionStatus === def.productionStatus, `B2C surface ${k} productionStatus must match mapping`);
    expect(row.surfaceRefs === def.relatedSurfaces, `B2C surface ${k} surfaceRefs must match mapping relatedSurfaces`);
    expect(row.guardrails === def.guardrails, `B2C surface ${k} guardrails must match mapping`);
    const union = new Set([...def.includedFromPackages, ...def.addOnEligible]);
    const rowSet = new Set(row.eligiblePackages);
    expect(
      union.size === rowSet.size && [...union].every((t) => rowSet.has(t)),
      `B2C surface ${k} eligiblePackages must equal union of mapping included+addOn`
    );
  }

  const supportGuard = getB2COfferAccess('ai_support').guardrails.toLowerCase();
  expect(
    /sos|miễn phí|kiểm soát|free/.test(supportGuard),
    'Expected ai_support guardrails (surface) to preserve SOS free-controlled doctrine hint'
  );

  for (const tier of ALL_PACKAGE_TIERS) {
    const fromHelper = getB2COffersForPackage(tier);
    const expected = B2C_COMMERCIAL_OFFER_KEYS.filter((k) => isOfferVisibleForPackage(k, tier));
    expect(
      JSON.stringify([...fromHelper].sort()) === JSON.stringify([...expected].sort()),
      'getB2COffersForPackage must align with isOfferVisibleForPackage for each tier'
    );
  }
}

function main() {
  console.log('=== check:commercial-mapping — doctrine semantic guardrails ===\n');
  assertStructure();
  assertDoctrineInvariants();
  assertPackageEligibility();
  assertOffersHaveMeters();
  assertBackboneMappings();
  assertSurfaceHints();
  assertProductionStatus();
  assertB2CEntitlementSurfaceCoherence();

  for (const m of BACKBONE_SERVICE_MAPPINGS) {
    expect(m.notes.trim().length > 0, `Expected backbone ${m.key} to have non-empty notes`);
    expect(m.doctrineRefs.length > 0, `Expected backbone ${m.key} to list doctrineRefs`);
  }

  if (errors.length) {
    console.error(`FAILED (${errors.length}):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('OK — all commercial flagship mapping invariants passed.');
}

main();
