# Red-Green-Refactor

> Default reference for normal TDD execution.

## Step 0: Check Working Memory
- review known edge cases in continuity
- review working context and key decisions

## RED
1. Write one failing test for one behavior.
2. Make sure it fails for the expected reason.

## VERIFY RED
- run the specific test
- confirm failure is meaningful, not a typo or setup issue

## GREEN
1. Write the simplest code that passes.
2. Avoid speculative options, helpers, or extra behavior.

## VERIFY GREEN
- rerun the test
- confirm it passes cleanly
- confirm related tests still pass if relevant

## REFACTOR
- improve names
- reduce duplication
- keep behavior unchanged
- rerun tests after cleanup

## Rule
If you did not see the test fail, you do not know that it tests the right thing.
