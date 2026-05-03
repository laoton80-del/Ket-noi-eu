/**
 * Lean structured logging: **Pino** (+ `pino-pretty` in non-production).
 * Production: JSON to stdout; optional **Axiom** NDJSON ingest when `AXIOM_TOKEN` + `AXIOM_DATASET` are set.
 *
 * Env: `LOG_LEVEL` (default `info`), `NODE_ENV`, `AXIOM_TOKEN`, `AXIOM_DATASET`.
 */

import { PassThrough } from 'node:stream';

import pino from 'pino';

const AXIOM_TOKEN = process.env.AXIOM_TOKEN?.trim();
const AXIOM_DATASET = process.env.AXIOM_DATASET?.trim();
const AXIOM_ENABLED = !!(AXIOM_TOKEN && AXIOM_DATASET);

const axiomQueue: string[] = [];
let axiomFlushTimer: NodeJS.Timeout | null = null;
let lineBuffer = '';

const AXIOM_FLUSH_MS = 4_000;
const AXIOM_MAX_BATCH = 80;

async function flushAxiomQueue(): Promise<void> {
  if (!AXIOM_ENABLED || axiomQueue.length === 0) return;
  const batch = axiomQueue.splice(0, axiomQueue.length);
  const url = `https://api.axiom.co/v1/datasets/${encodeURIComponent(AXIOM_DATASET!)}/ingest`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AXIOM_TOKEN}`,
        'Content-Type': 'application/x-ndjson',
      },
      body: `${batch.join('\n')}\n`,
    });
  } catch {
    /* avoid throwing from logger sink */
  }
}

function scheduleAxiomFlush(): void {
  if (!AXIOM_ENABLED) return;
  if (axiomFlushTimer) return;
  axiomFlushTimer = setInterval(() => {
    void flushAxiomQueue();
  }, AXIOM_FLUSH_MS);
  axiomFlushTimer.unref?.();
}

function enqueueAxiomLine(jsonLine: string): void {
  if (!AXIOM_ENABLED || jsonLine.length === 0) return;
  axiomQueue.push(jsonLine);
  if (axiomQueue.length >= AXIOM_MAX_BATCH) {
    void flushAxiomQueue();
  } else {
    scheduleAxiomFlush();
  }
}

function attachAxiomTee(stream: PassThrough): void {
  stream.on('data', (chunk: Buffer) => {
    lineBuffer += chunk.toString('utf8');
    let nl: number;
    while ((nl = lineBuffer.indexOf('\n')) >= 0) {
      const line = lineBuffer.slice(0, nl).trim();
      lineBuffer = lineBuffer.slice(nl + 1);
      if (line.length > 0) enqueueAxiomLine(line);
    }
  });
}

const level = (process.env.LOG_LEVEL?.trim() || 'info') as pino.LevelWithSilent;
const isProd = process.env.NODE_ENV === 'production';

function buildLogger(): pino.Logger {
  if (!isProd) {
    return pino({
      level,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, singleLine: true, translateTime: 'SYS:standard' },
      },
    });
  }

  if (AXIOM_ENABLED) {
    const pass = new PassThrough();
    pass.pipe(process.stdout);
    attachAxiomTee(pass);
    return pino({ level }, pass);
  }

  return pino({ level }, pino.destination(1));
}

export const logger = buildLogger();

export async function flushLogsForShutdown(): Promise<void> {
  if (axiomFlushTimer) {
    clearInterval(axiomFlushTimer);
    axiomFlushTimer = null;
  }
  await flushAxiomQueue();
}
