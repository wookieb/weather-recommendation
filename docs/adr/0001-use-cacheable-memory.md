# ADR 0001: Use CacheableMemory for In-Process Caching

## Status

Accepted

## Context

This service currently needs process-local caching for provider lookups. Forecast lookup caches successful provider data for a short TTL and does not require cross-process sharing yet.

## Decision

Use `CacheableMemory` for in-process caches.

## Consequences

Cache behavior stays explicit, fast, and dependency-light. If later deployments need shared cache state, introduce that with a separate ADR instead of replacing `CacheableMemory` ad hoc.
