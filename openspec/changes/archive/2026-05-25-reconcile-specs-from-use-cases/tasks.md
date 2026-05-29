## 1. Use case absorption — coverage audit

Every behavior area from the (now-deleted) use case catalog landed in the spec(s) noted below. Spec scenarios are the durable record; this list is a historical map.

- [x] Onboarding (welcome + 5-step wizard) → `onboarding` (OB-001..OB-017)
- [x] Daily Intake Tracking → `intake-tracking` (IT-001..IT-027)
- [x] Daily Weight Tracking → `weight-tracking` (WT-001..WT-012)
- [x] Plan Review → `plan-review` (PR-001..PR-006)
- [x] History → `history` (HI-001..HI-013)
- [x] Progress & Analytics → `progress` (PG-001..PG-004)
- [x] Profile Management → `profile` (PF-001..PF-015)
- [x] Data Export → `data-export` (EX-001..EX-007)
- [x] Data Import → `data-import` (IM-001..IM-005)
- [x] Navigation & App Shell → `app-shell` (AS-001..AS-009)
- [x] About Page → folded into `app-shell` (AS-005)
- [x] Global error page → folded into `app-shell` (AS-006)
- [x] Input Validation Boundaries → distributed across feature specs as per-field boundary scenarios; rule shapes in `_conv-validation` (VAL-001..VAL-011)
- [x] Data Freshness & Reactivity → `app-shell` "Data freshness on navigation and after mutations" (AS-007..AS-009)
- [x] Gesture Interactions → `_conv-gestures` (GES-001..GES-008); picker-specific semantics in `profile` (PF-005..PF-007)

## 2. Cross-cutting normalizations landed alongside

- [x] ID prefix declared in every spec's `## Purpose` (17 specs)
- [x] Every scenario tagged `[<PREFIX>-<NNN>]`, zero-padded 3-digit, monotonically increasing per spec
- [x] SHALL statements made behavioral; concrete values pushed into scenarios
- [x] CLAUDE.md updated with the ID convention and prefix registry
- [x] `openspec/config.yaml` rules updated with the scenario-format and traceability rules

## 3. Inconsistencies surfaced — review for follow-up changes

- [ ] 3.1 **Body-data weight range asymmetry**: frontend slider 30–300 kg vs backend validator 30–330 kg. Captured as-is in `onboarding` scenarios. Decide whether to align; if so, raise a separate change.
- [ ] 3.2 **Weight tracker stepper lower bound**: UI permits 0.5 kg, backend rejects below 30 kg. Captured explicitly as `[WT-009] UI permits value below backend lower bound`. UX improvement candidate (clamp UI to 30 kg) — separate change if desired.
- [ ] 3.3 **Sex field naming**: "Male/Female" preserved. If gender-inclusive language is desired, raise a separate change.

## 4. Archive

- [ ] 4.1 Delete `USE_CASES.md` from the repo root
- [ ] 4.2 `openspec archive --skip-specs reconcile-specs-from-use-cases`
- [ ] 4.3 Commit the result
