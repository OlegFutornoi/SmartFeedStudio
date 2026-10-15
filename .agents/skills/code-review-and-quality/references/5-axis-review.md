# Five-Axis Code Review Rubric

## Axis 1: Correctness

- Verify contract and specification match.
- Check edge cases: null, empty collections, boundary numbers, zero values.
- Verify error handling and fail-safe behaviors.
- Ensure all automated tests pass and assert real invariants.
- Check concurrency, race conditions, and mutation ordering.

## Axis 2: Readability and Simplicity

- Descriptive names following repository conventions.
- Straightforward control flow without deep callback nesting or complex ternaries.
- Modularity budget: files stay under 250 lines.
- No dead code: remove unused imports, dead variables, and legacy comments.
- No unnecessary abstractions or premature generalizations.

## Axis 3: Architecture and Boundaries

- CQRS decoupling: controllers dispatch commands/queries; handlers in separate files.
- Zero relative imports (`../`): strictly use `@/` path aliases or `@smartfeed/shared`.
- Domain segregation: cloud backend never performs desktop workspace filesystem operations.
- Clean database mapping: all models map to snake_case; timestamps use timestamptz.

## Axis 4: Security

- Input validation: class-validator on all request DTO properties.
- Authorization: guards on all mutation endpoints.
- Secret protection: zero hardcoded fallback strings; secrets excluded from responses and logs.
- Safe execution: execFile with argument arrays, never shell string concatenation.

## Axis 5: Performance

- Zero N+1 queries: batch Prisma lookups or use relation eager-loading.
- Cursor pagination on all high-volume endpoints.
- Deduplicated frontend network calls via useRef guards.
- Stream backpressure and bounded chunking on large feed imports.
