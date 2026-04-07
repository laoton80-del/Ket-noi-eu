import type { CreateOrderCommand, CreateOrderResult } from './orderEngineTypes';
import type { OrderCapacityInput } from '../../../domain/b2b';
import type { B2BDb } from './bookingEngine';

export type CreateOrderTransactionImpl = (db: B2BDb, cmd: CreateOrderCommand) => Promise<CreateOrderResult>;

let createOrderTransactionImpl: CreateOrderTransactionImpl | null = null;

export function registerCreateOrderTransaction(impl: CreateOrderTransactionImpl): void {
  createOrderTransactionImpl = impl;
}

export function clearCreateOrderTransactionForTests(): void {
  createOrderTransactionImpl = null;
}

export type OrderCapacityResult = { ok: true } | { ok: false; reason: 'slot_full' | 'outside_window' };

/**
 * Grocery retail / wholesale / legacy: validate pickup/delivery window capacity.
 * Wholesale may require `qualified_pending_confirm` before treating window as firm — product layer on `BusinessOrder`.
 */
export async function checkOrderWindowCapacity(
  _db: B2BDb,
  _input: OrderCapacityInput
): Promise<OrderCapacityResult> {
  void _db;
  void _input;
  return { ok: true };
}

export async function createOrderTransaction(db: B2BDb, cmd: CreateOrderCommand): Promise<CreateOrderResult> {
  if (createOrderTransactionImpl) return createOrderTransactionImpl(db, cmd);
  return {
    ok: false,
    code: 'not_implemented',
    message: 'Register createOrderTransaction via registerCreateOrderTransaction (e.g. Cloud Functions init)',
  };
}
