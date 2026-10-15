---
name: browser-debugging
description: Live interactive browser debugging, DOM tree inspection, console log analysis, screenshot capture, and network request inspection using direct Playwright MCP tools in SmartFeed Studio. Use when diagnosing client-side UI bugs, visual regressions, missing DOM elements, hydration mismatches, or network errors in real time. Do not use for server-side Jest unit testing; use systematic-debugging instead.
rules: [core, frontend, testing]
---

# Live Browser Debugging via Playwright MCP

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/frontend.md`, `.agents/rules/testing.md`.
2. Verify invariant `CORE-08`: 100% MCP auto-approval. Execute tools without confirmation prompts.
3. Verify invariant `CORE-09`: ban of `browser_subagent`. Use direct Playwright MCP tool calls (`ServerName: "playwright"`).
4. Do not speculate on UI state without inspecting live DOM or console output.

## Inputs

- Target application URL (`http://localhost:3000` or `http://localhost:1420`).
- User bug report or observed visual defect.

## Procedure

1. Step 1 - Navigate and Reproduce: call `browser_navigate` to load the target URL. Simulate user interaction with `browser_click` or `browser_fill_form`. Capture the defect visually with `browser_take_screenshot`.
2. Step 2 - Inspect Console and Network: call `browser_console_messages` to capture React render errors, hydration mismatches, and uncaught exceptions. Call `browser_network_requests` to inspect HTTP status codes and payloads.
3. Step 3 - Inspect DOM Accessibility Tree: call `browser_snapshot` to inspect live element hierarchy, computed roles, accessible names, and visibility states.
4. Step 4 - Trace Root Cause: correlate HTTP 4xx/5xx responses, React state, or CSS stacking contexts to the exact source file.
5. Step 5 - Implement Structural Fix: edit source code addressing the root cause, respecting the <250-line modularity budget (`CORE-04`).
6. Step 6 - Visual and Console Verification: reload the page with `browser_navigate`. Call `browser_console_messages` to confirm 0 new console errors. Call `browser_take_screenshot` to confirm visual restoration.

## Outputs

- Root cause diagnosis report with captured console logs and network statuses.
- Structural code fixes in `apps/desktop` or `apps/admin-portal`.
- Verification screenshots proving issue resolution.

## Gate (stop condition)

- Target bug reproduced, root cause identified, and structural fix applied.
- Console logs show 0 uncaught errors on page reload.
- Targeted Playwright test passes cleanly.

## Never

- Never invoke `browser_subagent` or `open_browser_url` (violates `CORE-09`).
- Never ask confirmation before calling Playwright MCP tools (violates `CORE-08`).
- Never guess element selectors without taking a `browser_snapshot`.
- Never patch symptoms superficially without inspecting console errors.

## References

- `references/playwright-mcp-tools.md` - read for full tool signatures of the Playwright MCP server.
