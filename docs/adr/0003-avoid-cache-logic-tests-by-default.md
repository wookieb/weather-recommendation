# ADR 0003: Avoid Cache Logic Tests by Default

## Status

Accepted

## Context

Cache libraries already own cache hit, miss, TTL, and wrapping behavior. Re-testing those details in feature tests makes tests brittle and duplicates dependency behavior.

## Decision

Do not test cache behavior unless a task explicitly asks for it.

## Consequences

Feature tests should cover domain behavior at service seams. Cache wiring can be verified by typechecking and module construction unless a requirement specifically calls for cache hit, miss, expiry, or key behavior.
