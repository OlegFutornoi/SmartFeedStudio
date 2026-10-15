---
name: streaming-large-feeds
description: High-volume streaming XML and CSV parsing for 100k+ SKU catalogs with Node.js stream backpressure, chunked BullMQ ingestion, and memory leak prevention. Use when importing, exporting, or parsing large catalog files.
rules:
  - core
  - backend
  - database
---

# Streaming Large Feeds

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/backend.md`, and `.agents/rules/database.md`.
2. Note all streaming and memory invariants in working notes.
3. If using saxes, stream/promises, or csv-parse, call context7: `resolve-library-id {libraryName: "saxes", query: "..."}` and `query-docs`.
4. Do not write streaming or ingestion code until steps 1-3 are complete.

## Streaming architecture and memory management

1. Zero in-memory DOM parsing: Never read entire XML or CSV feeds into memory using `fs.readFileSync`, `buffer.toString()`, or `xml2js.parseStringPromise` on large buffers. Feeds exceeding 5 MB will trigger Out-Of-Memory (OOM) errors.
2. Event-driven SAX parsing: Use streaming event parsers (`saxes` or `csv-parse/stream`). Handle stream backpressure explicitly by pausing the readable stream (`stream.pause()`) when chunk buffers fill, and resuming (`stream.resume()`) after chunk persistence or queue handoff completes.
3. Chunked ingestion: Split product streams into fixed-size chunks (500 to 1,000 SKUs). Enqueue each chunk as an independent sub-task in BullMQ or persist via chunked bulk upserts.
4. Stream cleanup and error safety: Always wrap streams in `stream/promises` pipeline or attach explicit error, close, and finish event listeners. In catch blocks, call `stream.destroy()` to prevent open file descriptor leaks.
5. Database batching: Never write 100k+ products in a single unchunked transaction. Use chunked `bulkUpsert` in batches of 500-1000 items with cursor pagination or indexed chunk keys.
