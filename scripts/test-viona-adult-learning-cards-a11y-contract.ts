/**
 * VIONA Academy — Adult Learning Cards accessibility contract (source-level).
 *
 * Scope: QuickPhrasesCard.tsx + SituationGrid.tsx.
 * Run (local tooling only): tsx --no-cache scripts/test-viona-adult-learning-cards-a11y-contract.ts
 *
 * Does not import the application runtime, React Native, or any provider.
 * Source files are parsed with the TypeScript compiler API; translations are
 * verified with an isolated i18next instance fed from the locale JSON files.
 * Static checks do not replace VoiceOver / TalkBack QA.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import i18next from 'i18next';

const root = process.cwd();
const QUICK_REL = 'src/components/learning/adult/QuickPhrasesCard.tsx';
const SITUATION_REL = 'src/components/learning/adult/SituationGrid.tsx';
const I18N_INDEX_REL = 'src/i18n/index.ts';
const LOCALES_REL = 'src/i18n/locales';

const EXPECTED_QUICK_PHRASES = ['Tôi không hiểu', 'Xin nói chậm lại', 'Tôi muốn đặt lịch'];
const EXPECTED_SITUATION_KEYS = ['doctor', 'paperwork', 'work', 'phone', 'school', 'grocery'];
const EXPECTED_QUICK_EXPORTS = ['DEFAULT_QUICK_PHRASES', 'QuickPhrasesCard'];
const EXPECTED_SITUATION_EXPORTS = [
  'ADULT_SITUATION_ITEM_KEYS',
  'AdultSituationKey',
  'situationLabelForKey',
  'pickSuggestedSituationKeyToday',
  'ADULT_SITUATION_ITEMS',
  'pickSuggestedSituationToday',
  'SituationGrid',
];
const ALLOWED_IMPORTS = [
  'react',
  'react-native',
  '../../../i18n',
  '../../widgets/WidgetCard',
  '../../widgets/AnimatedPressable',
  '../../../theme/theme',
  '../../../theme/typography',
];
const NATIVE_FALLBACK_LOCALES = ['cs', 'de', 'fr', 'ja', 'ko'];

const EXPECTED_KEYS: string[] = [
  'academySub.adult.quickPhrasesTitle',
  'academySub.adult.quickPhrasesHint',
  'academySub.adult.situationSection',
  'academySub.adult.situationHint',
  ...EXPECTED_SITUATION_KEYS.map((k) => `academySub.adult.situations.${k}`),
];

// ---------------------------------------------------------------------------
// Tiny assertion harness
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` :: ${detail}` : ''}`);
  }
}

function readSource(rel: string): string {
  return readFileSync(path.join(root, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// AST helpers
// ---------------------------------------------------------------------------
type JsxEl = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

function parseTsx(source: string, fileName: string): ts.SourceFile {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function jsxElements(sf: ts.SourceFile): JsxEl[] {
  const out: JsxEl[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) out.push(n);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

function tagOf(el: JsxEl, sf: ts.SourceFile): string {
  return el.tagName.getText(sf);
}

function elementText(el: JsxEl, sf: ts.SourceFile): string {
  return ts.isJsxOpeningElement(el) ? el.parent.getText(sf) : el.getText(sf);
}

function attrOf(el: JsxEl, name: string): ts.JsxAttribute | undefined {
  for (const p of el.attributes.properties) {
    if (ts.isJsxAttribute(p) && p.name.getText() === name) return p;
  }
  return undefined;
}

function compact(s: string): string {
  return s.replace(/\s+/g, '');
}

function attrLiteral(a: ts.JsxAttribute | undefined): string | undefined {
  const init = a?.initializer;
  if (!init) return undefined;
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteralLike(init.expression)) {
    return init.expression.text;
  }
  return undefined;
}

function attrExpr(a: ts.JsxAttribute | undefined): string | undefined {
  const init = a?.initializer;
  if (init && ts.isJsxExpression(init) && init.expression) return compact(init.expression.getText());
  return undefined;
}

function exportedNames(sf: ts.SourceFile): string[] {
  const names: string[] = [];
  const isExported = (n: ts.Node): boolean =>
    ts.canHaveModifiers(n) &&
    (ts.getModifiers(n) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  for (const st of sf.statements) {
    if (ts.isVariableStatement(st) && isExported(st)) {
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) names.push(d.name.text);
      }
    } else if (ts.isFunctionDeclaration(st) && isExported(st) && st.name) {
      names.push(st.name.text);
    } else if (ts.isTypeAliasDeclaration(st) && isExported(st)) {
      names.push(st.name.text);
    }
  }
  return names;
}

function stringArrayConst(sf: ts.SourceFile, name: string): string[] | undefined {
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const d of st.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || d.name.text !== name || !d.initializer) continue;
      let init: ts.Expression = d.initializer;
      while (ts.isAsExpression(init) || ts.isParenthesizedExpression(init)) init = init.expression;
      if (!ts.isArrayLiteralExpression(init)) return undefined;
      const out: string[] = [];
      for (const e of init.elements) {
        if (!ts.isStringLiteralLike(e)) return undefined;
        out.push(e.text);
      }
      return out;
    }
  }
  return undefined;
}

function findTitleText(els: JsxEl[], sf: ts.SourceFile, keyFragment: string): JsxEl | undefined {
  return els.find((e) => tagOf(e, sf) === 'Text' && elementText(e, sf).includes(keyFragment));
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ---------------------------------------------------------------------------
// Analyzers (return findings; empty list = contract satisfied)
// ---------------------------------------------------------------------------
function analyzeQuickPhrases(source: string): string[] {
  const f: string[] = [];
  const sf = parseTsx(source, 'QuickPhrasesCard.tsx');
  const els = jsxElements(sf);

  const pressables = els.filter((e) => tagOf(e, sf) === 'AnimatedPressable');
  if (pressables.length !== 1) f.push(`expected exactly 1 AnimatedPressable, found ${pressables.length}`);
  for (const p of pressables) {
    if (attrLiteral(attrOf(p, 'accessibilityRole')) !== 'button') {
      f.push('phrase row missing accessibilityRole="button"');
    }
    if (attrExpr(attrOf(p, 'accessibilityState')) !== '{disabled:!onPressPhrase}') {
      f.push('phrase row accessibilityState must be { disabled: !onPressPhrase }');
    }
    if (attrExpr(attrOf(p, 'disabled')) !== '!onPressPhrase') {
      f.push('phrase row must keep disabled={!onPressPhrase}');
    }
    if (attrExpr(attrOf(p, 'onPress')) !== '()=>onPressPhrase?.(phrase)') {
      f.push('phrase row must keep onPress={() => onPressPhrase?.(phrase)}');
    }
    if (attrOf(p, 'accessibilityLabel')) {
      f.push('phrase row must not override the accessible name (accessibilityLabel)');
    }
    if (!elementText(p, sf).includes('{phrase}')) {
      f.push('phrase row must keep rendering {phrase} as its accessible text');
    }
  }

  const title = findTitleText(els, sf, 'academySub.adult.quickPhrasesTitle');
  if (!title) f.push('quick phrases title Text not found');
  else if (attrLiteral(attrOf(title, 'accessibilityRole')) !== 'header') {
    f.push('quick phrases title missing accessibilityRole="header"');
  }

  const exp = exportedNames(sf);
  for (const name of EXPECTED_QUICK_EXPORTS) {
    if (!exp.includes(name)) f.push(`missing export ${name}`);
  }
  const phrases = stringArrayConst(sf, 'DEFAULT_QUICK_PHRASES');
  if (!phrases || !sameList(phrases, EXPECTED_QUICK_PHRASES)) {
    f.push('DEFAULT_QUICK_PHRASES changed');
  }
  if (!/export const QuickPhrasesCard = React\.memo\(QuickPhrasesCardComponent\)/.test(source)) {
    f.push('QuickPhrasesCard must remain React.memo(QuickPhrasesCardComponent)');
  }
  return f;
}

function analyzeSituationGrid(source: string): string[] {
  const f: string[] = [];
  const sf = parseTsx(source, 'SituationGrid.tsx');
  const els = jsxElements(sf);

  const pressables = els.filter((e) => tagOf(e, sf) === 'AnimatedPressable');
  if (pressables.length !== 1) f.push(`expected exactly 1 AnimatedPressable, found ${pressables.length}`);
  for (const p of pressables) {
    if (attrLiteral(attrOf(p, 'accessibilityRole')) !== 'button') {
      f.push('situation chip missing accessibilityRole="button"');
    }
    if (attrExpr(attrOf(p, 'onPress')) !== '()=>onPressSituation(label)') {
      f.push('situation chip must keep onPress={() => onPressSituation(label)}');
    }
    if (attrOf(p, 'accessibilityLabel')) {
      f.push('situation chip must not override the accessible name (accessibilityLabel)');
    }
    if (!elementText(p, sf).includes('{label}')) {
      f.push('situation chip must keep rendering {label} as its accessible text');
    }
  }
  if (!/const label = situationLabelForKey\(key, t\);/.test(source)) {
    f.push('situation chip label must stay situationLabelForKey(key, t)');
  }
  if (!/ADULT_SITUATION_ITEM_KEYS\.map\(/.test(source)) {
    f.push('situation chips must keep ADULT_SITUATION_ITEM_KEYS ordering');
  }

  const title = findTitleText(els, sf, 'academySub.adult.situationSection');
  if (!title) f.push('situation section title Text not found');
  else if (attrLiteral(attrOf(title, 'accessibilityRole')) !== 'header') {
    f.push('situation section title missing accessibilityRole="header"');
  }

  const exp = exportedNames(sf);
  for (const name of EXPECTED_SITUATION_EXPORTS) {
    if (!exp.includes(name)) f.push(`missing export ${name}`);
  }
  const keys = stringArrayConst(sf, 'ADULT_SITUATION_ITEM_KEYS');
  if (!keys || !sameList(keys, EXPECTED_SITUATION_KEYS)) f.push('ADULT_SITUATION_ITEM_KEYS changed');
  if (!/export const SituationGrid = React\.memo\(SituationGridComponent\)/.test(source)) {
    f.push('SituationGrid must remain React.memo(SituationGridComponent)');
  }
  if (!/return t\(`academySub\.adult\.situations\.\$\{key\}`\)/.test(source)) {
    f.push('situationLabelForKey translation key template changed');
  }
  if (!/new Date\(\)\.getDate\(\) % ADULT_SITUATION_ITEM_KEYS\.length/.test(source)) {
    f.push('pickSuggestedSituationKeyToday selection logic changed');
  }
  return f;
}

function referencedKeys(source: string): string[] {
  const found = new Set<string>();
  for (const m of source.match(/academySub\.adult\.[A-Za-z0-9_.${}]+/g) ?? []) {
    if (m === 'academySub.adult.situations.${key}') {
      for (const k of EXPECTED_SITUATION_KEYS) found.add(`academySub.adult.situations.${k}`);
    } else {
      found.add(m);
    }
  }
  return [...found].sort();
}

/** No new provider / network / payment / SOS / timer behaviour and no extra translation keys. */
function analyzeSafety(source: string, fileName: string): string[] {
  const f: string[] = [];
  const sf = parseTsx(source, fileName);
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) {
      const spec = st.moduleSpecifier.text;
      if (!ALLOWED_IMPORTS.includes(spec)) f.push(`unexpected import: ${spec}`);
    }
  }
  const forbidden =
    /\b(fetch|XMLHttpRequest|WebSocket|setTimeout|setInterval|requestAnimationFrame|useEffect|axios)\b|\b(sos|stripe|payment|wallet|escrow|openai|llm|provider|navigation|navigate)\b/i;
  const hit = source.match(forbidden);
  if (hit) f.push(`forbidden behaviour token: ${hit[0]}`);
  const keys = referencedKeys(source);
  for (const k of keys) {
    if (!EXPECTED_KEYS.includes(k)) f.push(`new translation key referenced: ${k}`);
  }
  return f;
}

function mutate(source: string, pattern: RegExp, replacement: string, label: string): string {
  const out = source.replace(pattern, replacement);
  if (out === source) throw new Error(`mutation fixture is a no-op: ${label}`);
  return out;
}

// ---------------------------------------------------------------------------
// i18n helpers
// ---------------------------------------------------------------------------
function readLocale(code: string): unknown {
  return JSON.parse(readSource(`${LOCALES_REL}/${code}.json`));
}

function lookup(obj: unknown, dotted: string): unknown {
  let cur: unknown = obj;
  for (const part of dotted.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const quickSrc = readSource(QUICK_REL);
  const gridSrc = readSource(SITUATION_REL);

  // 1-4. Semantics, disabled state, headings, callbacks and exports.
  const quickFindings = analyzeQuickPhrases(quickSrc);
  check('QuickPhrasesCard satisfies accessibility + preservation contract', quickFindings.length === 0, quickFindings.join('; '));
  const gridFindings = analyzeSituationGrid(gridSrc);
  check('SituationGrid satisfies accessibility + preservation contract', gridFindings.length === 0, gridFindings.join('; '));

  // 5-6. No new behaviour, no extra translation keys.
  const quickSafety = analyzeSafety(quickSrc, 'QuickPhrasesCard.tsx');
  check('QuickPhrasesCard introduces no new provider/network/payment/SOS/timer behaviour or keys', quickSafety.length === 0, quickSafety.join('; '));
  const gridSafety = analyzeSafety(gridSrc, 'SituationGrid.tsx');
  check('SituationGrid introduces no new provider/network/payment/SOS/timer behaviour or keys', gridSafety.length === 0, gridSafety.join('; '));
  const allRefs = [...new Set([...referencedKeys(quickSrc), ...referencedKeys(gridSrc)])].sort();
  check(
    'referenced Academy Adult keys equal the pre-existing key set',
    sameList(allRefs, [...EXPECTED_KEYS].sort()),
    `found=${allRefs.join(',')}`
  );

  // 7. Keys exist in en and vi.
  const en = readLocale('en');
  const vi = readLocale('vi');
  for (const [code, data] of [['en', en], ['vi', vi]] as const) {
    const missing = EXPECTED_KEYS.filter((k) => {
      const v = lookup(data, k);
      return typeof v !== 'string' || v.trim().length === 0;
    });
    check(`all referenced Academy Adult keys exist in ${code}`, missing.length === 0, missing.join(','));
  }

  // 8. Missing native translations resolve through the English fallback (isolated i18next instance).
  const i18nIndex = readSource(I18N_INDEX_REL);
  check("app i18n config keeps fallbackLng: 'en'", /fallbackLng:\s*'en'/.test(i18nIndex));
  for (const code of NATIVE_FALLBACK_LOCALES) {
    const data = readLocale(code);
    const inst = i18next.createInstance();
    await inst.init({
      lng: code,
      fallbackLng: 'en',
      resources: { en: { translation: en as object }, [code]: { translation: data as object } },
      interpolation: { escapeValue: false },
    });
    const bad: string[] = [];
    for (const k of EXPECTED_KEYS) {
      const out = inst.t(k);
      const native = lookup(data, k);
      const expected = typeof native === 'string' && native.length > 0 ? native : (lookup(en, k) as string);
      if (typeof out !== 'string' || out !== expected || out === k || out.includes('academySub.')) bad.push(k);
    }
    check(`locale ${code}: keys resolve natively or via English fallback without raw keys`, bad.length === 0, bad.join(','));
  }

  // 9. In-memory mutation fixtures must be detected.
  const quickMutations: Array<[string, string]> = [
    ['remove button role', mutate(quickSrc, /\s*accessibilityRole="button"/, '', 'q-role')],
    ['remove accessibilityState', mutate(quickSrc, /\s*accessibilityState=\{\{[^}]*\}\}/, '', 'q-state-remove')],
    ['constant accessibilityState', mutate(quickSrc, /accessibilityState=\{\{ disabled: !onPressPhrase \}\}/, 'accessibilityState={{ disabled: false }}', 'q-state-const')],
    ['remove header role', mutate(quickSrc, /\s*accessibilityRole="header"/, '', 'q-header')],
    ['drop disabled prop', mutate(quickSrc, /\s*disabled=\{!onPressPhrase\}/, '', 'q-disabled')],
    ['break callback', mutate(quickSrc, /onPressPhrase\?\.\(phrase\)/, 'void 0', 'q-callback')],
    ['override accessible name', mutate(quickSrc, /accessibilityRole="button"/, 'accessibilityRole="button" accessibilityLabel="x"', 'q-label')],
    ['remove export', mutate(quickSrc, /export const DEFAULT_QUICK_PHRASES/, 'const DEFAULT_QUICK_PHRASES', 'q-export')],
  ];
  for (const [label, mutated] of quickMutations) {
    check(`mutation detected (QuickPhrasesCard): ${label}`, analyzeQuickPhrases(mutated).length > 0);
  }
  check(
    'mutation detected (QuickPhrasesCard safety): added timer',
    analyzeSafety(`${quickSrc}\nsetTimeout(() => undefined, 1);\n`, 'QuickPhrasesCard.tsx').length > 0
  );
  check(
    'mutation detected (QuickPhrasesCard safety): new translation key',
    analyzeSafety(quickSrc.replace('quickPhrasesHint', 'quickPhrasesNewKey'), 'QuickPhrasesCard.tsx').length > 0
  );

  const gridMutations: Array<[string, string]> = [
    ['remove button role', mutate(gridSrc, /\s*accessibilityRole="button"/, '', 'g-role')],
    ['remove header role', mutate(gridSrc, /\s*accessibilityRole="header"/, '', 'g-header')],
    ['break callback', mutate(gridSrc, /onPressSituation\(label\)/, 'onPressSituation("")', 'g-callback')],
    ['reorder situations', mutate(gridSrc, /'doctor',\s*'paperwork'/, "'paperwork', 'doctor'", 'g-order')],
    ['override accessible name', mutate(gridSrc, /accessibilityRole="button"/, 'accessibilityRole="button" accessibilityLabel="x"', 'g-label')],
    ['remove export', mutate(gridSrc, /export function pickSuggestedSituationToday/, 'function pickSuggestedSituationToday', 'g-export')],
  ];
  for (const [label, mutated] of gridMutations) {
    check(`mutation detected (SituationGrid): ${label}`, analyzeSituationGrid(mutated).length > 0);
  }
  check(
    'mutation detected (SituationGrid safety): added fetch',
    analyzeSafety(`${gridSrc}\nvoid fetch;\n`, 'SituationGrid.tsx').length > 0
  );

  console.log(`\nSUMMARY passed=${passed} failed=${failed}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((err: unknown) => {
  console.error('FATAL', err);
  process.exitCode = 1;
});
