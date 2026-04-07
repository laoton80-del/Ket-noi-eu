/**
 * Source-of-truth map for local vs server state (pilot app).
 * Use with `storageKeys.ts` ownership comments; keeps mental model for refactors.
 *
 * | Domain              | UI / local cache                          | Authoritative                         |
 * |---------------------|-------------------------------------------|---------------------------------------|
 * | Auth profile        | `STORAGE_KEYS.authSession`                | Same (no backend auth in pilot)       |
 * | Wallet balance      | `STORAGE_KEYS.wallet`                     | Firebase `walletOps` + Firestore      |
 * | Learning progress   | AuthUser flags + HocTap `learningB1B234`  | Profile fields; unlock flag local     |
 * | Daily loop          | `STORAGE_KEYS.dailyLoop`                 | Local-only                            |
 * | Companion memory    | `STORAGE_KEYS.companionMemory`            | Local-only                            |
 * | Growth / analytics  | `STORAGE_KEYS.growthSnapshot`             | Local snapshot (export to BI later)   |
 * | Interpreter history | `STORAGE_KEYS.usageHistory` (`interpreter`) | Local append-only log              |
 * | Document vault      | `STORAGE_KEYS.documentVault`              | Local-only (metadata)                 |
 */
export {};
