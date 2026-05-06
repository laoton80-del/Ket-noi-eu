export type TipSplitMethod = 'EQUAL' | 'PERCENTAGE';

export type StaffTipProfile = Readonly<{
  staffId: string;
  displayName: string;
  hoursWorked: number;
  performanceWeightPercent: number;
}>;

export type DailyTipDistributionRow = Readonly<{
  staffId: string;
  displayName: string;
  allocatedTipMajor: number;
  method: TipSplitMethod;
}>;

export type DailyTipsResult = Readonly<{
  merchantId: string;
  totalTipsMajor: number;
  method: TipSplitMethod;
  rows: readonly DailyTipDistributionRow[];
}>;

const STAFF_BY_MERCHANT: Readonly<Record<string, readonly StaffTipProfile[]>> = {
  'merchant-lotus': [
    { staffId: 'stf-1', displayName: 'Mai', hoursWorked: 8, performanceWeightPercent: 35 },
    { staffId: 'stf-2', displayName: 'Vy', hoursWorked: 7, performanceWeightPercent: 30 },
    { staffId: 'stf-3', displayName: 'An', hoursWorked: 6, performanceWeightPercent: 20 },
    { staffId: 'stf-4', displayName: 'Nhi', hoursWorked: 5, performanceWeightPercent: 15 },
  ],
  'merchant-pho': [
    { staffId: 'stf-a', displayName: 'Hùng', hoursWorked: 8, performanceWeightPercent: 45 },
    { staffId: 'stf-b', displayName: 'Linh', hoursWorked: 8, performanceWeightPercent: 35 },
    { staffId: 'stf-c', displayName: 'Thảo', hoursWorked: 6, performanceWeightPercent: 20 },
  ],
};

const TIPS_BY_MERCHANT: Readonly<Record<string, number>> = {
  'merchant-lotus': 186.4,
  'merchant-pho': 224.7,
};

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function fallbackProfiles(): readonly StaffTipProfile[] {
  return [
    { staffId: 'staff-1', displayName: 'Staff 1', hoursWorked: 8, performanceWeightPercent: 50 },
    { staffId: 'staff-2', displayName: 'Staff 2', hoursWorked: 8, performanceWeightPercent: 50 },
  ];
}

/**
 * Auto-distributes daily Stripe tips into staff-level rows for merchant payroll review.
 */
export function calculateDailyTips(merchantId: string, method: TipSplitMethod): DailyTipsResult {
  const key = merchantId.trim().length > 0 ? merchantId.trim() : 'merchant-lotus';
  const staff = STAFF_BY_MERCHANT[key] ?? fallbackProfiles();
  const totalTipsMajor = round2(TIPS_BY_MERCHANT[key] ?? 120);
  if (staff.length === 0) {
    return { merchantId: key, totalTipsMajor, method, rows: [] };
  }
  if (method === 'EQUAL') {
    const each = round2(totalTipsMajor / staff.length);
    const rows = staff.map((s, i): DailyTipDistributionRow => {
      if (i < staff.length - 1) {
        return { staffId: s.staffId, displayName: s.displayName, allocatedTipMajor: each, method };
      }
      const allocatedBefore = each * (staff.length - 1);
      return {
        staffId: s.staffId,
        displayName: s.displayName,
        allocatedTipMajor: round2(totalTipsMajor - allocatedBefore),
        method,
      };
    });
    return { merchantId: key, totalTipsMajor, method, rows };
  }

  const rows: DailyTipDistributionRow[] = [];
  let allocated = 0;
  for (let i = 0; i < staff.length; i += 1) {
    const s = staff[i];
    if (i < staff.length - 1) {
      const share = round2((totalTipsMajor * s.performanceWeightPercent) / 100);
      allocated += share;
      rows.push({ staffId: s.staffId, displayName: s.displayName, allocatedTipMajor: share, method });
      continue;
    }
    rows.push({
      staffId: s.staffId,
      displayName: s.displayName,
      allocatedTipMajor: round2(totalTipsMajor - allocated),
      method,
    });
  }
  return { merchantId: key, totalTipsMajor, method, rows };
}
