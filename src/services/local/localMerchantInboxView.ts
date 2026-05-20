import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

import { evaluateLocalMerchantRequestConfirmEligibility } from './localMerchantRequestConfirmEligibility';
import { evaluateLocalMerchantRequestRejectEligibility } from './localMerchantRequestRejectEligibility';

export type LocalMerchantInboxRow = Readonly<{
  status: LocalServiceRequestStatus;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
}>;

export type LocalMerchantInboxActions = Readonly<{
  canConfirm: boolean;
  canReject: boolean;
}>;

/** Client-side action flags aligned with server confirm/reject eligibility (no wallet inference). */
export function deriveLocalMerchantInboxActions(row: LocalMerchantInboxRow): LocalMerchantInboxActions {
  const confirm = evaluateLocalMerchantRequestConfirmEligibility(row);
  const reject = evaluateLocalMerchantRequestRejectEligibility(row);
  return {
    canConfirm: confirm.kind === 'confirm',
    canReject: reject.kind === 'reject',
  };
}
