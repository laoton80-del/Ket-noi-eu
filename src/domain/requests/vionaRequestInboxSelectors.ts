import type {
  VionaRequestRecord,
  VionaRequestStatus,
  VionaRequestUniverse,
} from './vionaRequestTypes';

export type VionaRequestInboxFilters = Readonly<{
  universe?: VionaRequestUniverse;
  status?: VionaRequestStatus;
  requiresHumanConfirmation?: boolean;
  hasPartnerResponse?: boolean;
}>;

export type VionaRequestInboxCounts = Readonly<{
  total: number;
  byStatus: Readonly<Partial<Record<VionaRequestStatus, number>>>;
  byUniverse: Readonly<Partial<Record<VionaRequestUniverse, number>>>;
  requiringHumanConfirmation: number;
  withPartnerResponse: number;
}>;

export function filterRequestsForInbox(
  requests: readonly VionaRequestRecord[],
  filters: VionaRequestInboxFilters = {}
): readonly VionaRequestRecord[] {
  return requests.filter((request) => {
    if (filters.universe !== undefined && request.universe !== filters.universe) {
      return false;
    }
    if (filters.status !== undefined && request.status !== filters.status) {
      return false;
    }
    if (
      filters.requiresHumanConfirmation === true &&
      request.status !== 'needsHumanConfirmation' &&
      request.humanConfirmation !== 'required' &&
      request.humanConfirmation !== 'requested'
    ) {
      return false;
    }
    if (filters.hasPartnerResponse === true && request.status !== 'partnerResponded') {
      return false;
    }
    return true;
  });
}

export function groupRequestsByStatus(
  requests: readonly VionaRequestRecord[]
): Readonly<Partial<Record<VionaRequestStatus, readonly VionaRequestRecord[]>>> {
  const groups: Partial<Record<VionaRequestStatus, VionaRequestRecord[]>> = {};
  for (const request of requests) {
    const bucket = groups[request.status] ?? [];
    bucket.push(request);
    groups[request.status] = bucket;
  }
  return groups;
}

export function groupRequestsByUniverse(
  requests: readonly VionaRequestRecord[]
): Readonly<Partial<Record<VionaRequestUniverse, readonly VionaRequestRecord[]>>> {
  const groups: Partial<Record<VionaRequestUniverse, VionaRequestRecord[]>> = {};
  for (const request of requests) {
    const bucket = groups[request.universe] ?? [];
    bucket.push(request);
    groups[request.universe] = bucket;
  }
  return groups;
}

export function getRequestsRequiringHumanConfirmation(
  requests: readonly VionaRequestRecord[]
): readonly VionaRequestRecord[] {
  return requests.filter(
    (request) =>
      request.status === 'needsHumanConfirmation' ||
      request.humanConfirmation === 'required' ||
      request.humanConfirmation === 'requested'
  );
}

export function getRequestsWithPartnerResponse(
  requests: readonly VionaRequestRecord[]
): readonly VionaRequestRecord[] {
  return requests.filter((request) => request.status === 'partnerResponded');
}

export function getRequestInboxCounts(
  requests: readonly VionaRequestRecord[]
): VionaRequestInboxCounts {
  const byStatus = groupRequestsByStatus(requests);
  const byUniverse = groupRequestsByUniverse(requests);

  const statusCounts = Object.fromEntries(
    Object.entries(byStatus).map(([status, items]) => [status, items.length])
  ) as Partial<Record<VionaRequestStatus, number>>;

  const universeCounts = Object.fromEntries(
    Object.entries(byUniverse).map(([universe, items]) => [universe, items.length])
  ) as Partial<Record<VionaRequestUniverse, number>>;

  return {
    total: requests.length,
    byStatus: statusCounts,
    byUniverse: universeCounts,
    requiringHumanConfirmation: getRequestsRequiringHumanConfirmation(requests).length,
    withPartnerResponse: getRequestsWithPartnerResponse(requests).length,
  };
}
