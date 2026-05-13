# Gate 3 — i18n Parity

> Only for multilingual projects, but mandatory when those projects ship localized content.

## Use When
- project has multiple locales
- localized content is user-facing

## What to Check
- key-count parity
- missing translations
- orphaned translations
- locale files staying in sync after changes

## Rule
If the project is multilingual, this gate is not optional.

## Integration
Use `cm-safe-i18n` to establish safer extraction, batching, and sync rules when localization work is active.
