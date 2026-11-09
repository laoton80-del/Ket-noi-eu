# P0-A1 provisional pilot price manifest

**Status: PROVISIONAL — no contract yet.** Re-verify the actual billed rate and
apply a risk buffer before real selling (V5 A1-PRICE-SEED).

| Field | Provisional value |
| --- | --- |
| Provider | `openai` |
| Model | `gpt-4o-mini` |
| Input price | `150000` micro-USD per 1,000,000 tokens ($0.15/1M) |
| Output price | `600000` micro-USD per 1,000,000 tokens ($0.60/1M) |
| Audio input/output | `0` (not used in the text pilot) |
| Image | `0` (not used in the text pilot) |
| Calculation version | `openai-list-2026-11-provisional` |
| Source | OpenAI published list price (developers.openai.com), checked 2026-11-09 |
| Temporary provider timeout | `45000` ms; provisional, set at activation |

The values are a provisional seed only. The Operator must verify the actual
contracted and billed rate and apply a risk buffer before enabling real sales.
The timeout is not seeded in code or in the database.

## Unpriced voice cost components

Telecom, STT, TTS, transfer, FX, tax, and risk buffer are not priced here. Voice
costs remain incomplete until these components have an approved source and
versioned price fields.
