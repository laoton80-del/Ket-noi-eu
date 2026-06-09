#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = {
  app: 'App.tsx',
  routes: 'src/navigation/routes.ts',
  tabs: 'src/navigation/MainTabNavigator.tsx',
  referenceLabs: 'src/navigation/referenceLabStackScreens.tsx',
};

const REQUIRED_FILES = [FILES.app, FILES.routes, FILES.tabs];

const CAPABILITY_RULES = [
  ['Consumer UI', /\b(home|local|travel|discover|services|companion|lifeos|dashboard|hub|storefront)\b/i],
  ['Merchant/B2B', /\b(b2b|merchant|catalog|orders|earnings|broker|partner|kol|inbound|trade|wholesale|supplier|workspace|sponsored|promo)\b/i],
  ['AI', /\b(ai|leona|assistant|interpreter|receptionist|teacher|copilot|autonomous|voice|call|tts)\b/i],
  ['Payment/wallet', /\b(wallet|checkout|pay|payment|paid|cash|cashout|cash-out|payout|vig|vio|stripe|billing|settle|settlement|refund|escrow|top[ -]?up|earnings)\b/i],
  ['Booking/request', /\b(booking|book|request|inbox|calendar|order|confirm|reservation|quote|fixer|concierge)\b/i],
  ['SOS/safety', /\b(sos|emergency|lifeline|ambulance|police|fire|gps|safety|medical|rescue|trusted contact|embassy)\b/i],
  ['Academy/learning', /\b(academy|learning|teacher|kids|vietkids|lesson|practice|flashcard|leaderboard)\b/i],
  ['Travel utility', /\b(travel|tourism|flight|hospitality|trip|vietnam|embassy|destination|pass|fixer|tourist)\b/i],
  ['Account/profile', /\b(account|profile|login|otp|role|personal|auth|session|vault|loyalty|reward|referral)\b/i],
  ['Docs/evidence/admin', /\b(admin|audit|ops|crm|campaign|marketing|facebook|factory|debug|command center|metrics|war room)\b/i],
];

const RISK_FLAG_RULES = [
  ['payment-like', /\b(wallet|checkout|pay|payment|paid|cash|cashout|cash-out|payout|vig|vio|stripe|billing|settle|settlement|refund|escrow|top[ -]?up|invoice|earnings|money|charged|captured)\b/i],
  ['booking mutation', /\b(booking|book|request|inbox|calendar|order|confirm|reservation|quote|receipt|fixer|concierge)\b/i],
  ['emergency/SOS', /\b(sos|emergency|lifeline|ambulance|police|fire|gps|rescue|trusted contact|authority|embassy|medical)\b/i],
  ['AI action', /\b(ai|leona|assistant|interpreter|receptionist|teacher|copilot|autonomous|voice|call|tts|function-calling)\b/i],
  ['legal/medical', /\b(legal|medical|tax|doctor|clinic|diagnosis|certificate|government|law|compliance|privacy)\b/i],
  ['auth/session', /\b(login|otp|auth|session|jwt|role|profile|personal hub|identity|workspace access)\b/i],
  ['tenant/merchant', /\b(tenant|merchant|b2b|workspace|catalog|orders|inbox|supplier|wholesale|broker|kol|partner|storefront)\b/i],
];

const EXPLICIT_UNIVERSE_RULES = [
  ['SOS', /^(EmergencySOS|SosPlusProfile|TravelSosHub)$/],
  ['B2B Wholesale / E-shop Import', /^(Orders|InternalTradeMarket|TabCatalog|TabOrders)$/],
  ['Academy', /^(TabAi|AdultLearningHome|KidsLearningHome|VietKids|KidsLeaderboard|LiveAiTeacher|Academy)$/],
  ['Home', /^(Tabs|TabHome|LifeOSDashboard|DashboardB2CPreview|KetNoiYeuThuong)$/],
  [
    'Travel',
    /^(TabTravel|TravelCompanion|TravelHub|VietnamHub|TourismCheckout|TourismBookingConfirmed|ViralWrap|TravelFlightSearch|TravelHospitality|FlightSearchAssistant|LocalFixer|LocalFixerCheckout|FixerEarnings)$/,
  ],
  [
    'Local',
    /^(TabLocal|LocalUniverse|LocalUserRequestStatus|MerchantDetail|MerchantStorefront|Discover|Services|LocalOpsAudit|VionaReferenceLocalPanelLab|VionaReferenceSingleCardLab|VionaReferenceMaterialLab|VionaReferencePanelCompositionLab|VionaReferenceFlagshipCardsLab|VionaNeonCardLab)$/,
  ],
  ['Account', /^(PersonalHub|Wallet|ReferralReward|CashOut|DailyReward|LoyaltyRewards|Vault|Login|Otp|RoleSelection|SetupProfile)$/],
  [
    'Business',
    /^(TabMerchant|TabEarnings|TabRadar|TabBrokerMerchants|TabQr|TabCommissions|TabBrokerWallet|TabCommandCenter|B2BPaywall|MerchantDashboard|AiReceptionistSetupChecklist|AiReceptionistDemoSimulator|AiReceptionistPilotRequest|InboundQueue|TourismMerchantInbox|LocalMerchantRequestInbox|SmartCalendar|WalletB2B|AdBidding|PromoTools|B2BPromotionSettings|SponsoredAds|KOLPartnerDashboard|PartnerOnboarding|AdminDashboard|AdminProfitDashboard|SalesLeadCRM|AdContentFactory|OutboundCampaign|FacebookWarRoom|MarketingApproval)$/,
  ],
];

const UNIVERSE_RULES = [
  ['SOS', /\b(sos|emergency|lifeline)\b/i],
  ['B2B Wholesale / E-shop Import', /\b(internaltrademarket|wholesale|e-shop|eshop|supplier|catalog import)\b/i],
  ['Academy', /\b(academy|learning|teacher|vietkids|kids|leaderboard|student|lesson)\b/i],
  ['Home', /\b(tabs|tabhome|home|lifeos|dashboardb2cpreview|dashboard|ketnoiyeuthuong)\b/i],
  ['Business', /\b(b2b|merchant|broker|business|orders|catalog|earnings|radar|qr|commissions|inbound|trade|ad bidding|promo|sponsored|kol|partner|paywall|smartcalendar|walletb2b)\b/i],
  ['Travel', /\b(travel|tourism|vietnamhub|viralwrap|flight|hospitality|fixer|trip|embassy|tourist)\b/i],
  ['Local', /\b(local|merchantdetail|merchantstorefront|services|discover)\b/i],
  ['Account', /\b(account|personalhub|canhan|wallet|cashout|dailyreward|referral|loyalty|vault|login|otp|roleselection|setupprofile|profile)\b/i],
];

const ADMIN_ROUTES = new Set([
  'AdminDashboard',
  'LocalOpsAudit',
  'AdminProfitDashboard',
  'SalesLeadCRM',
  'AdContentFactory',
  'OutboundCampaign',
  'FacebookWarRoom',
  'MarketingApproval',
  'TabCommandCenter',
]);

function relPath(absPath) {
  return path.relative(ROOT, absPath).replace(/\\/g, '/');
}

function absPath(rel) {
  return path.resolve(ROOT, rel);
}

function exists(relOrAbs) {
  return fs.existsSync(path.isAbsolute(relOrAbs) ? relOrAbs : absPath(relOrAbs));
}

function read(rel) {
  const file = absPath(rel);
  if (!fs.existsSync(file)) return '';
  return fs.readFileSync(file, 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripMd(value) {
  return value.replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
}

function normalizeText(value) {
  return value.replace(/\r\n/g, '\n');
}

function resolveImport(importerRel, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(ROOT, path.dirname(importerRel), specifier);
  const candidates = [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    `${base}.jsx`,
    `${base}.js`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
    path.join(base, 'index.jsx'),
    path.join(base, 'index.js'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return found ? relPath(found) : null;
}

function parseImports(source, importerRel) {
  const imports = new Map();
  const importRe = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRe.exec(source)) !== null) {
    const clause = match[1].trim();
    const specifier = match[2];
    const resolved = resolveImport(importerRel, specifier);
    if (!resolved) continue;

    const named = clause.match(/\{([\s\S]*?)\}/);
    if (named) {
      for (const raw of named[1].split(',')) {
        const part = raw.trim().replace(/^type\s+/, '');
        if (!part) continue;
        const aliasMatch = part.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
        const local = aliasMatch ? aliasMatch[2] : part.match(/^([A-Za-z_$][\w$]*)/)?.[1];
        if (local) imports.set(local, { importName: aliasMatch ? aliasMatch[1] : local, file: resolved });
      }
    }

    const defaultPart = clause.replace(/\{[\s\S]*\}/, '').replace(/,$/, '').trim();
    if (defaultPart && !defaultPart.startsWith('type ')) {
      const local = defaultPart.split(',')[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(local)) {
        imports.set(local, { importName: 'default', file: resolved });
      }
    }
  }
  return imports;
}

function mergeImports(...maps) {
  const merged = new Map();
  for (const map of maps) {
    for (const [key, value] of map) merged.set(key, value);
  }
  return merged;
}

function findMatchingClose(text, openIndex, openChar, closeChar) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === openChar) depth += 1;
    if (ch === closeChar) depth -= 1;
    if (depth === 0) return i;
  }
  return -1;
}

function pickLikelyImportedComponent(body, imports) {
  const candidates = [];
  for (const name of imports.keys()) {
    if (!/^[A-Z]/.test(name)) continue;
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g');
    let match;
    let lastIndex = -1;
    while ((match = re.exec(body)) !== null) lastIndex = match.index;
    if (lastIndex >= 0) candidates.push({ name, lastIndex });
  }
  candidates.sort((a, b) => b.lastIndex - a.lastIndex);
  return candidates[0]?.name ?? null;
}

function parseGateWrappers(source, imports) {
  const wrappers = new Map();
  const gateRe = /const\s+([A-Za-z_$][\w$]*)\s*=\s*mvpGateByFlag\s*\(/g;
  let match;
  while ((match = gateRe.exec(source)) !== null) {
    const name = match[1];
    const openIndex = source.indexOf('(', match.index);
    const closeIndex = findMatchingClose(source, openIndex, '(', ')');
    if (closeIndex < 0) continue;
    const body = source.slice(openIndex + 1, closeIndex);
    const target = pickLikelyImportedComponent(body, imports);
    wrappers.set(name, {
      target,
      text: body,
      gate: 'mvpGateByFlag',
    });
  }
  return wrappers;
}

function parseFunctionWrappers(source, imports) {
  const wrappers = new Map();
  const functions = [];
  const fnRe = /function\s+([A-Z][A-Za-z0-9_$]*)\s*\([^)]*\)\s*(?::[^{]+)?\s*\{/g;
  let match;
  while ((match = fnRe.exec(source)) !== null) {
    const name = match[1];
    const openIndex = source.indexOf('{', match.index);
    const closeIndex = findMatchingClose(source, openIndex, '{', '}');
    if (closeIndex < 0) continue;
    const body = source.slice(openIndex + 1, closeIndex);
    functions.push({ name, body });
  }

  const functionNames = new Set(functions.map((fn) => fn.name));
  for (const { name, body } of functions) {
    let target = pickLikelyImportedComponent(body, imports);
    if (!target) {
      const localCandidates = [];
      for (const localName of functionNames) {
        if (localName === name) continue;
        const re = new RegExp(`\\b${escapeRegExp(localName)}\\b`, 'g');
        let localMatch;
        let lastIndex = -1;
        while ((localMatch = re.exec(body)) !== null) lastIndex = localMatch.index;
        if (lastIndex >= 0) localCandidates.push({ name: localName, lastIndex });
      }
      localCandidates.sort((a, b) => b.lastIndex - a.lastIndex);
      target = localCandidates[0]?.name ?? null;
    }
    if (!target || target === name) continue;
    wrappers.set(name, {
      target,
      text: body,
      gate: /B2BWorkspaceGate|MvpSurfaceDisabledScreen|getFeatureFlags|hasB2BWorkspaceAccess/i.test(body)
        ? 'function gate'
        : 'function wrapper',
    });
  }
  return wrappers;
}

function parseMainTabConstants(routesText) {
  const map = new Map();
  const routeToRole = new Map();
  const groupRe = /(B2C|B2B|BROKER|ADMIN):\s*\{([\s\S]*?)\n\s*\}/g;
  let groupMatch;
  while ((groupMatch = groupRe.exec(routesText)) !== null) {
    const role = groupMatch[1];
    const body = groupMatch[2];
    const entryRe = /([A-Za-z0-9_]+):\s*'([^']+)'/g;
    let entry;
    while ((entry = entryRe.exec(body)) !== null) {
      map.set(`MAIN_TAB.${role}.${entry[1]}`, entry[2]);
      routeToRole.set(entry[2], role);
    }
  }
  return { map, routeToRole };
}

function extractTypeBlock(source, typeName) {
  const marker = `export type ${typeName}`;
  const start = source.indexOf(marker);
  if (start < 0) return '';
  const openIndex = source.indexOf('{', start);
  const closeIndex = findMatchingClose(source, openIndex, '{', '}');
  if (openIndex < 0 || closeIndex < 0) return '';
  return source.slice(openIndex + 1, closeIndex);
}

function cleanComment(raw) {
  return raw
    .replace(/\/\*\*?/g, '')
    .replace(/\*\//g, '')
    .replace(/^\s*\*\s?/gm, '')
    .replace(/\/\/\s?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTypeRoutes(routesText, typeName) {
  const block = extractTypeBlock(routesText, typeName);
  const routes = new Map();
  const lines = normalizeText(block).split('\n');
  let pendingComment = '';
  let collectingComment = false;
  let commentBuffer = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^ {2}\/\*\*/.test(line)) {
      collectingComment = true;
      commentBuffer = [trimmed];
      if (trimmed.includes('*/')) {
        pendingComment = cleanComment(commentBuffer.join('\n'));
        collectingComment = false;
        commentBuffer = [];
      }
      continue;
    }

    if (collectingComment) {
      commentBuffer.push(trimmed);
      if (trimmed.includes('*/')) {
        pendingComment = cleanComment(commentBuffer.join('\n'));
        collectingComment = false;
        commentBuffer = [];
      }
      continue;
    }

    if (/^ {2}\/\//.test(line)) {
      pendingComment = cleanComment(trimmed);
      continue;
    }

    const routeMatch = line.match(/^ {2}([A-Za-z0-9_]+)\s*:/);
    if (routeMatch) {
      routes.set(routeMatch[1], {
        route: routeMatch[1],
        sourceType: typeName,
        comment: pendingComment,
      });
      pendingComment = '';
    }
  }

  return routes;
}

function parseScreenRegistrations(source, navigatorName, mainTabMap) {
  const registrations = [];
  const re = new RegExp(`<${navigatorName}\\.Screen\\b([\\s\\S]*?)(?:\\/>|>\\s*<\\/${navigatorName}\\.Screen>)`, 'g');
  let match;
  while ((match = re.exec(source)) !== null) {
    const attrs = match[1];
    const nameLiteral = attrs.match(/\bname\s*=\s*"([^"]+)"/);
    const nameExpr = attrs.match(/\bname\s*=\s*\{([^}]+)\}/);
    const componentMatch = attrs.match(/\bcomponent\s*=\s*\{\s*([A-Za-z_$][\w$]*)\s*\}/);
    let route = nameLiteral?.[1] ?? null;
    if (!route && nameExpr) {
      const expr = nameExpr[1].trim();
      route = mainTabMap.get(expr) ?? expr;
    }
    if (!route) continue;
    registrations.push({
      route,
      component: componentMatch?.[1] ?? 'UNKNOWN',
      navigator: navigatorName,
      sourceIndex: match.index,
      snippet: source.slice(Math.max(0, match.index - 260), Math.min(source.length, match.index + attrs.length + 260)),
    });
  }
  return registrations;
}

function registrationScore(registration) {
  if (!registration || registration.component === 'UNKNOWN') return 0;
  if (/DisabledSurface|DisabledScreen|Unavailable|Paywall/i.test(registration.component)) return 1;
  return 2;
}

function resolveComponent(component, imports, wrappers) {
  const chain = [];
  let current = component;
  const seen = new Set();
  while (current && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    const direct = imports.get(current);
    if (direct?.file) {
      return {
        component: current,
        file: direct.file,
        chain,
        wrapperText: chain
          .map((item) => wrappers.get(item)?.text)
          .filter(Boolean)
          .join('\n'),
      };
    }
    const wrapped = wrappers.get(current);
    if (!wrapped?.target) break;
    current = wrapped.target;
  }
  return {
    component,
    file: 'UNKNOWN',
    chain,
    wrapperText: chain
      .map((item) => wrappers.get(item)?.text)
      .filter(Boolean)
      .join('\n'),
  };
}

function walkFiles(dirRel, allowedExts = new Set(['.ts', '.tsx', '.json', '.md'])) {
  const start = absPath(dirRel);
  if (!fs.existsSync(start)) return [];
  const out = [];
  const stack = [start];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (allowedExts.has(path.extname(entry.name))) {
        out.push(relPath(full));
      }
    }
  }
  return out.sort();
}

function classifyUniverse(route, file, comment, content) {
  for (const [universe, re] of EXPLICIT_UNIVERSE_RULES) {
    if (re.test(route)) return universe;
  }
  const text = `${route} ${file} ${comment} ${content.slice(0, 2500)}`;
  for (const [universe, re] of UNIVERSE_RULES) {
    if (re.test(text)) return universe;
  }
  return 'Unknown';
}

function classifyCapabilities(route, file, comment, content) {
  const text = `${route} ${file} ${comment} ${content.slice(0, 5000)}`;
  const capabilities = CAPABILITY_RULES.filter(([, re]) => re.test(text)).map(([name]) => name);
  return capabilities.length ? [...new Set(capabilities)] : ['Unknown'];
}

function classifyRiskFlags(route, file, comment, content, wrapperText) {
  const text = `${route} ${file} ${comment} ${wrapperText} ${content.slice(0, 7000)}`;
  return RISK_FLAG_RULES.filter(([, re]) => re.test(text)).map(([name]) => name);
}

function inferReadiness(route, component, visibility, comment, content, wrapperText) {
  const text = `${route} ${component} ${visibility} ${comment} ${wrapperText} ${content.slice(0, 5000)}`;
  const lower = text.toLowerCase();

  if (/coming soon|unavailable|not available/.test(lower)) return 'Coming Soon';
  if (/local-only|simulated|mock|demo|debug|war room|reference lab|factory/.test(lower)) return 'Demo';
  if (/pilot|hold-mode|request-only|manual walkthrough|local stub entitlement/.test(lower)) return 'Pilot';
  if (/beta/.test(lower)) return 'Beta';
  if (/preview|review|operating preview|transparentmodal/.test(lower)) return 'Preview';
  if (/lite|travelliteenabled|academyliteenabled|assistant lite/.test(lower)) return 'Lite';
  if (/gated|mvpgatebyflag|b2bworkspacegate|feature flag|disabledscreen|getfeatureflags/.test(lower)) return 'Gated';
  return 'Unknown';
}

function inferRiskLevel(flags) {
  const set = new Set(flags);
  if (
    set.has('emergency/SOS') ||
    set.has('legal/medical') ||
    (set.has('payment-like') && set.has('booking mutation')) ||
    (set.has('payment-like') && set.has('tenant/merchant')) ||
    (set.has('AI action') && (set.has('payment-like') || set.has('booking mutation') || set.has('tenant/merchant')))
  ) {
    return 'HIGH';
  }
  return flags.length ? 'MEDIUM' : 'LOW';
}

function reasonFor(entry) {
  const parts = [];
  parts.push(entry.visibility);
  if (entry.readiness !== 'Unknown') parts.push(`${entry.readiness} signal`);
  if (entry.flags.length) parts.push(`risk flags: ${entry.flags.join(', ')}`);
  if (entry.screenFile === 'UNKNOWN') parts.push('screen file unresolved');
  if (entry.comment) parts.push(`route note: ${entry.comment}`);
  return parts.join('; ');
}

function componentRouteReferences(routeNames) {
  const files = walkFiles('src/components', new Set(['.ts', '.tsx']));
  const routePattern = new RegExp(`\\b(${routeNames.map(escapeRegExp).join('|')})\\b`);
  const refs = [];
  for (const file of files) {
    const text = read(file);
    if (!/(navigate|RootStackParamList|RootTabParamList|MAIN_TAB|screen|route)/i.test(text)) continue;
    const matches = [...new Set((text.match(routePattern) ?? []).slice(0, 12))];
    if (matches.length) refs.push({ file, routes: matches });
  }
  return refs;
}

function markdownTable(rows, columns) {
  const header = `| ${columns.map((c) => c.title).join(' | ')} |`;
  const sep = `| ${columns.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${columns.map((c) => stripMd(String(c.value(row) ?? ''))).join(' | ')} |`);
  return [header, sep, ...body].join('\n');
}

function main() {
  const missing = REQUIRED_FILES.filter((file) => !exists(file));
  if (missing.length) {
    console.error(`Missing required route source files: ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const appText = read(FILES.app);
  const routesText = read(FILES.routes);
  const tabsText = read(FILES.tabs);
  const referenceLabText = exists(FILES.referenceLabs) ? read(FILES.referenceLabs) : '';

  const appImports = parseImports(appText, FILES.app);
  const tabImports = parseImports(tabsText, FILES.tabs);
  const referenceLabImports = referenceLabText ? parseImports(referenceLabText, FILES.referenceLabs) : new Map();
  const imports = mergeImports(appImports, tabImports, referenceLabImports);
  const wrappers = new Map([
    ...parseGateWrappers(appText, imports),
    ...parseFunctionWrappers(appText, imports),
    ...parseGateWrappers(tabsText, imports),
    ...parseFunctionWrappers(tabsText, imports),
  ]);

  const { map: mainTabMap, routeToRole } = parseMainTabConstants(routesText);
  const stackTypeRoutes = parseTypeRoutes(routesText, 'RootStackParamList');
  const tabTypeRoutes = parseTypeRoutes(routesText, 'RootTabParamList');
  const stackRegs = parseScreenRegistrations(appText, 'Stack', mainTabMap);
  const tabRegs = parseScreenRegistrations(tabsText, 'Tab', mainTabMap);
  const referenceLabRegs = referenceLabText
    ? parseScreenRegistrations(referenceLabText, 'Stack', mainTabMap).map((reg) => ({
        ...reg,
        referenceLab: true,
      }))
    : [];

  const all = new Map();
  for (const entry of stackTypeRoutes.values()) all.set(entry.route, { ...entry, typeSurface: 'stack' });
  for (const entry of tabTypeRoutes.values()) all.set(entry.route, { ...entry, typeSurface: 'tab' });

  for (const reg of [...stackRegs, ...tabRegs, ...referenceLabRegs]) {
    const existing = all.get(reg.route) ?? { route: reg.route, comment: '', sourceType: 'registration-only' };
    const registration =
      existing.registration && registrationScore(existing.registration) >= registrationScore(reg)
        ? existing.registration
        : reg;
    all.set(reg.route, { ...existing, registration });
  }

  const inventory = [...all.values()]
    .map((typed) => {
      const reg = typed.registration;
      const resolved = reg ? resolveComponent(reg.component, imports, wrappers) : null;
      const screenFile = resolved?.file ?? 'UNKNOWN';
      const content = screenFile !== 'UNKNOWN' ? read(screenFile) : '';
      let visibility = 'hidden/typed-only';
      if (reg?.navigator === 'Tab') {
        const role = routeToRole.get(typed.route) ?? 'unknown role';
        visibility = `visible tab (${role})`;
      } else if (reg?.navigator === 'Stack') {
        visibility = reg.referenceLab
          ? 'reference-lab gated stack'
          : ADMIN_ROUTES.has(typed.route)
            ? 'admin-gated stack'
            : 'stack/hidden';
      }
      if (typed.route === 'Tabs') visibility = 'root stack shell';

      const wrapperText = resolved?.wrapperText ?? '';
      const universe = classifyUniverse(typed.route, screenFile, typed.comment ?? '', content);
      const capabilities = classifyCapabilities(typed.route, screenFile, typed.comment ?? '', content);
      const flags = classifyRiskFlags(typed.route, screenFile, typed.comment ?? '', content, wrapperText);
      const readiness = inferReadiness(
        typed.route,
        reg?.component ?? 'UNKNOWN',
        visibility,
        typed.comment ?? '',
        content,
        wrapperText
      );
      const risk = inferRiskLevel(flags);
      const row = {
        route: typed.route,
        registeredComponent: reg?.component ?? 'UNKNOWN',
        resolvedComponent: resolved?.component ?? 'UNKNOWN',
        componentChain: resolved?.chain?.join(' -> ') ?? 'UNKNOWN',
        screenFile,
        universe,
        visibility,
        readiness,
        risk,
        capabilities,
        flags,
        comment: typed.comment ?? '',
      };
      row.reason = reasonFor(row);
      return row;
    })
    .sort((a, b) => {
      const order = ['Home', 'Local', 'Travel', 'Academy', 'Business', 'B2B Wholesale / E-shop Import', 'Account', 'SOS', 'Unknown'];
      return order.indexOf(a.universe) - order.indexOf(b.universe) || a.route.localeCompare(b.route);
    });

  const routeNames = inventory.map((entry) => entry.route).filter(Boolean);
  const componentRefs = componentRouteReferences(routeNames);
  const universeCounts = [...inventory.reduce((map, entry) => {
    map.set(entry.universe, (map.get(entry.universe) ?? 0) + 1);
    return map;
  }, new Map())].sort((a, b) => a[0].localeCompare(b[0]));
  const unknowns = inventory.filter((entry) => entry.universe === 'Unknown' || entry.readiness === 'Unknown' || entry.screenFile === 'UNKNOWN');
  const highRisk = inventory.filter((entry) => entry.risk === 'HIGH');

  const lines = [];
  lines.push('# VIONA Route Capability Inventory');
  lines.push('');
  lines.push('Generated by `node scripts/viona-route-capability-inventory.mjs`.');
  lines.push('This script is read-only and uses best-effort static extraction. Unknown means unresolved, not absent.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Routes/screens found: ${inventory.length}`);
  lines.push(`- Universes mapped: ${universeCounts.map(([name]) => name).join(', ')}`);
  lines.push(`- Unknown/unclassified: ${unknowns.length}`);
  lines.push(`- High-risk capabilities: ${highRisk.length}`);
  lines.push(`- Component files with route references: ${componentRefs.length}`);
  lines.push('');
  lines.push('## Universe Counts');
  lines.push('');
  lines.push(markdownTable(
    universeCounts.map(([universe, count]) => ({ universe, count })),
    [
      { title: 'Universe', value: (row) => row.universe },
      { title: 'Routes', value: (row) => row.count },
    ]
  ));
  lines.push('');
  lines.push('## High-Risk Capability Routes');
  lines.push('');
  lines.push(highRisk.length
    ? markdownTable(highRisk, [
        { title: 'Route', value: (row) => row.route },
        { title: 'Universe', value: (row) => row.universe },
        { title: 'Screen file', value: (row) => row.screenFile },
        { title: 'Flags', value: (row) => row.flags.join(', ') },
        { title: 'Reason', value: (row) => row.reason },
      ])
    : 'No high-risk routes detected by heuristic flags.');
  lines.push('');
  lines.push('## Route Inventory');
  lines.push('');
  lines.push(markdownTable(inventory, [
    { title: 'Route', value: (row) => row.route },
    { title: 'Screen file', value: (row) => row.screenFile },
    { title: 'Universe', value: (row) => row.universe },
    { title: 'Surface', value: (row) => row.visibility },
    { title: 'Readiness', value: (row) => row.readiness },
    { title: 'Risk', value: (row) => row.risk },
    { title: 'Capabilities', value: (row) => row.capabilities.join(', ') },
    { title: 'Risk flags', value: (row) => row.flags.join(', ') || 'none' },
    { title: 'Reason', value: (row) => row.reason },
  ]));
  lines.push('');
  lines.push('## Component Route References');
  lines.push('');
  lines.push(componentRefs.length
    ? markdownTable(componentRefs, [
        { title: 'Component file', value: (row) => row.file },
        { title: 'Referenced routes', value: (row) => row.routes.join(', ') },
      ])
    : 'No component route references detected.');
  lines.push('');
  lines.push('## Non-Removal Guard');
  lines.push('');
  lines.push('- Do not remove capability because a readiness label is Lite, Pilot, Demo, Beta, Preview, Coming Soon, Gated, or Unknown.');
  lines.push('- Gate instead of delete: keep the route/capability in the map, make the production state honest, and require owner signoff before live payment, SOS, AI mutation, booking, wallet, auth, or tenant behavior.');
  lines.push('');

  console.log(lines.join('\n'));
}

main();
