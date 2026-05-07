"use strict";
/**
 * Handoff JSON contracts for the sprint flow (v2.0).
 *
 * Each sprint phase emits a typed handoff JSON under `.cm/handoff/`.
 * Downstream skills read the predecessor's handoff to pick up cold,
 * eliminating re-derivation cost.
 *
 * Schema versioning: every contract has a `schema: "<name>@<n>"` field.
 * Bump @n on breaking change; readers should reject unknown majors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HANDOFF_FILENAMES = void 0;
exports.HANDOFF_FILENAMES = {
    'intent@1': 'intent.json',
    'plan@1': 'plan.json',
    'exec@1': 'exec.json',
    'review@1': 'review.json',
    'quality@1': 'quality.json',
    'retro@1': 'retro.json',
    'party@1': 'party.json',
};
