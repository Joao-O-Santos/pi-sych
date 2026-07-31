# Drift and reconciliation fixture

This fixture supplies an intentionally inconsistent project, evidence map, decision record, style rule, manuscript, and analysis output. The acceptance test builds a fingerprinted `SYNC.json` from these files, changes the copied analysis output, and verifies that Pi Sych reports all seven fixed drift types without selecting a winner or mutating files before approval.
