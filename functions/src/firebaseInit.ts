import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

import { registerCreateBookingTransaction } from '@app/services/b2b/engines/bookingEngine';
import { registerCreateOrderTransaction } from '@app/services/b2b/engines/orderEngine';
import { createBookingTransactionAdmin } from './b2b/booking/createBookingTransactionAdmin';
import { createOrderTransactionAdmin } from './b2b/order/createOrderTransactionAdmin';

initializeApp();

registerCreateBookingTransaction((db, cmd) => {
  const fs = (db as Firestore | undefined) ?? getFirestore();
  return createBookingTransactionAdmin(fs, cmd);
});

registerCreateOrderTransaction((db, cmd) => {
  const fs = (db as Firestore | undefined) ?? getFirestore();
  return createOrderTransactionAdmin(fs, cmd);
});
