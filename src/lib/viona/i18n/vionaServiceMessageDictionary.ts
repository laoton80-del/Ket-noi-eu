/**
 * Pack33 — Omni-Localization for server-generated Viona messages (see
 * docs/product/VIONA_PACK33_GLOBAL_COMPLIANCE_PLAN.md §6).
 *
 * A static, code-shipped dictionary — same pattern as the existing client-side
 * `src/i18n/strings.ts` — deliberately **not** database-backed: adding a language is a code change
 * + deploy, never a migration; lookups are a synchronous, in-memory object access (O(1), zero added
 * latency, zero database storage growth as request volume grows).
 *
 * This module is additive only — it does not replace any existing hardcoded English string at any
 * call site in this implementation increment (plan §6.3: migration is incremental, one call site
 * at a time, in a future pack). No existing `appendVionaExecutionAuditEvent()` call site is
 * modified to use this module here.
 */

export type VionaServiceMessageLocale = 'en' | 'vi' | 'cs' | 'de' | 'fr' | 'ja' | 'ko';

/** Mirrors the 7 locales the client i18n stack already ships (`src/i18n/locales/`) — no new
 * locale list is invented for server-side messages. */
export const VIONA_SERVICE_MESSAGE_LOCALES: readonly VionaServiceMessageLocale[] = [
  'en', 'vi', 'cs', 'de', 'fr', 'ja', 'ko',
] as const;

export const VIONA_SERVICE_MESSAGE_FALLBACK_LOCALE: VionaServiceMessageLocale = 'en';

export type VionaServiceMessageId =
  | 'execution_plan_denied_operator_approval'
  | 'execution_plan_denied_policy'
  | 'escrow_hold_denied_insufficient_funds'
  | 'dispatcher_rejected_unknown_tool';

type VionaServiceMessageTemplate = string;

/**
 * One entry per `VionaServiceMessageId`, one key per locale. Adding a new message ID or a new
 * locale is a plain object-literal edit — never a schema/migration change (plan §6.3). Interpolation
 * uses `{{paramName}}` tokens, resolved by `resolveVionaServiceMessage()` below.
 */
const VIONA_SERVICE_MESSAGE_DICTIONARY: Readonly<
  Record<VionaServiceMessageId, Readonly<Record<VionaServiceMessageLocale, VionaServiceMessageTemplate>>>
> = {
  execution_plan_denied_operator_approval: {
    en: 'Execution plan denied — operator approval not granted.',
    vi: 'Kế hoạch thực thi bị từ chối — chưa có sự chấp thuận của operator.',
    cs: 'Plán provedení zamítnut — chybí schválení operátorem.',
    de: 'Ausführungsplan abgelehnt — Genehmigung durch den Betreiber fehlt.',
    fr: "Plan d'exécution refusé — approbation de l'opérateur manquante.",
    ja: '実行プランが拒否されました — オペレーターの承認がありません。',
    ko: '실행 계획이 거부되었습니다 — 운영자 승인이 없습니다.',
  },
  execution_plan_denied_policy: {
    en: 'Execution plan denied by policy ({{denialReason}}).',
    vi: 'Kế hoạch thực thi bị chính sách từ chối ({{denialReason}}).',
    cs: 'Plán provedení zamítnut zásadami ({{denialReason}}).',
    de: 'Ausführungsplan durch Richtlinie abgelehnt ({{denialReason}}).',
    fr: "Plan d'exécution refusé par la politique ({{denialReason}}).",
    ja: 'ポリシーにより実行プランが拒否されました（{{denialReason}}）。',
    ko: '정책에 의해 실행 계획이 거부되었습니다 ({{denialReason}}).',
  },
  escrow_hold_denied_insufficient_funds: {
    en: 'VIO Credits hold denied — insufficient funds.',
    vi: 'Giữ VIO Credits bị từ chối — không đủ số dư.',
    cs: 'Podržení VIO Credits zamítnuto — nedostatek prostředků.',
    de: 'VIO-Credits-Reservierung abgelehnt — unzureichendes Guthaben.',
    fr: 'Blocage des VIO Credits refusé — fonds insuffisants.',
    ja: 'VIOクレジットの保留が拒否されました — 残高不足です。',
    ko: 'VIO 크레딧 보류가 거부되었습니다 — 잔액이 부족합니다.',
  },
  dispatcher_rejected_unknown_tool: {
    en: 'Autonomous dispatcher rejected the request — no matching tool.',
    vi: 'Bộ phân luồng tự trị từ chối yêu cầu — không có tool phù hợp.',
    cs: 'Autonomní dispatcher žádost zamítl — žádný odpovídající nástroj.',
    de: 'Autonomer Dispatcher hat die Anfrage abgelehnt — kein passendes Tool.',
    fr: "Le répartiteur autonome a rejeté la demande — aucun outil correspondant.",
    ja: '自律ディスパッチャーがリクエストを拒否しました — 一致するツールがありません。',
    ko: '자율 디스패처가 요청을 거부했습니다 — 일치하는 도구가 없습니다.',
  },
} as const;

function interpolate(template: string, params: Readonly<Record<string, string>> | undefined): string {
  if (params == null) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in params ? params[key]! : match,
  );
}

/**
 * Pure, synchronous lookup. Fallback chain: requested locale -> `en` -> the literal `messageId`
 * string itself. Never throws (matches the existing client i18n's own `fallbackLng: 'en'`
 * convention exactly — plan §6.3).
 */
export function resolveVionaServiceMessage(
  id: VionaServiceMessageId,
  locale: VionaServiceMessageLocale,
  params?: Readonly<Record<string, string>>,
): string {
  const entry = VIONA_SERVICE_MESSAGE_DICTIONARY[id];
  if (entry == null) return id;

  const template =
    entry[locale] ?? entry[VIONA_SERVICE_MESSAGE_FALLBACK_LOCALE] ?? null;
  if (template == null) return id;

  return interpolate(template, params);
}
