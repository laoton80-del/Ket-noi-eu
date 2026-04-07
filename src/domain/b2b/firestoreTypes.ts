/**
 * Avoid importing firebase in pure domain files.
 * Use Firestore Timestamp at integration boundary.
 */
export type FirestoreTimestamp =
  | { _seconds: number; _nanoseconds: number }
  | Date
  | { toDate: () => Date };
