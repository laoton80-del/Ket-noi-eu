# P0-A1 price unit: micro-USD per million tokens

`AiModelPrice.inputMicrousdPerMillionTokens` and
`AiModelPrice.outputMicrousdPerMillionTokens` store integer micro-USD for one
million tokens. This keeps provider prices representable with `BIGINT` without
fractional micro-USD per token.

For chat reserve calculation, use `BigInt` arithmetic and round up once after
combining input and output:

```ts
const numerator =
  inputTokens * inputMicrousdPerMillionTokens +
  outputTokens * outputMicrousdPerMillionTokens;
const costMicrousd = (numerator + 999_999n) / 1_000_000n;
```

Equivalently:

```text
costMicrousd = ceil((inputTokens * inputMicrousdPerMillionTokens + outputTokens * outputMicrousdPerMillionTokens) / 1000000)
```

Audio and image pricing retain their existing per-second and per-unit columns.
TTS pricing per character requires its own column in the future A1-FIREBASE
migration; it is not part of this migration.
