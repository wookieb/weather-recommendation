# ADR 0002: Use Cache Wrap for Cache-Aside Reads

## Status

Accepted

## Context

Cache-aside code can drift into repeated `get` / compute / `set` blocks. That makes successful-only caching and TTL choices easier to implement inconsistently.

## Decision

Use `cache.wrap` whenever possible for cache-aside reads.

## Consequences

Call sites should put provider or computation work inside the wrapped function and pass an explicit key and TTL. Uncacheable outcomes should throw from the wrapped function when the cache library does not cache errors by default.
