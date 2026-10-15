---
name: firecrawl-parse
description: Document parsing and extraction (PDF, DOCX, XLSX, HTML) into markdown via Firecrawl CLI or MCP. Use when ingesting external supplier catalogs or converting document specifications.
rules:
  - core
  - backend
---

# Firecrawl Document Parsing

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/backend.md`.
2. Note all file size limits (50 MB) and output destination paths.
3. If using Firecrawl MCP tools, verify tool availability (`firecrawl_parse`).
4. Do not stream large document markdown dumps into stdout or conversational context.

## Parsing instructions

1. Output file destination: Always write parsed documents directly to `.firecrawl/<filename>.md` using the `-o` flag. Never stream multi-megabyte document parses directly to stdout.
2. File types supported: PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, HTML.
3. Context protection: Inspect parsed document outputs incrementally using `head`, `grep_search`, or `view_file` with line range limits.
4. Credit budget: Monitor credit usage via `firecrawl credit-usage` before executing large batch catalog document transformations.
