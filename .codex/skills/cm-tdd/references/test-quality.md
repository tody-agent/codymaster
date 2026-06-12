# Test Quality

> Use when designing or reviewing tests.

## Good Tests
- one behavior per test
- clear name
- behavior-focused, not implementation-biased
- minimal mocking unless unavoidable
- readable enough to act as usage documentation

## Bad Test Signals
- vague names like `test1`
- multiple behaviors in one assertion cluster
- mocks proving the mock, not the real behavior
- tests that pass before the feature is written

## Rule
If a test name contains “and”, it probably wants to be split.
