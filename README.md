# VIONA Stage-2 Merge Authority Ledger

This branch (`viona-governance-merge-ledger-v1`) is the dedicated,
machine-managed authority ledger for the VIONA REC2 Two-Stage Merge
Control system (Stage 2: Explicit Merge Authorization).

- This ref is NOT an application source branch.
- This ref is NOT a feature branch, deployment branch, or general
  governance-doc branch.
- This ref MUST NOT contain application source code.
- Content on this ref is written only by the authorized Stage-2
  ledger-writer workflow, using the GitHub Contents API sha-conditional
  (optimistic-locking) write as the atomic claim primitive for
  merge-authorization lifecycle records.
- History on this ref is protected: force-pushes and branch deletion
  are disabled. Do not attempt to rewrite history on this ref.

See docs/governance/VIONA_REC2_TWO_STAGE_MERGE_CONTROL_DESIGN_V1.md
on the main product history for the design this ledger implements.

This bootstrap commit contains no authorization records. It exists
only to establish the ledger schema identity and ref protection.