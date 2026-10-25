---
name: http-flow-builder
description: Use this skill when asked to create or reverse-engineer HTTP API request flows (.http files) by observing the UI behavior. This skill enables you to navigate the UI, record all network requests using a bundled Playwright script, and generate a precise .http file that exactly matches the frontend's API calls.
---

# HTTP Flow Builder (`http-flow-builder`)

Reverse-engineering and authoring declarative JetBrains HTTP Client flows (`tools/http/`) from observed UI network traffic.

---

## 1. Network Recording Workflow

1. Setup Recorder:
   - Copy `.agents/skills/http-flow-builder/scripts/network-recorder.ts` to `.temp/run-flow.ts`. Never edit original skill script.
   - Insert target Playwright UI actions (`page.goto`, `page.fill`, `page.click`) inside `// AGENT INSERTS UI STEPS HERE`.

2. Execute Recorder:

   ```bash
   npx tsx .temp/run-flow.ts
   ```

   Generates captured request payloads and responses in `.temp/network_dump.json`.

3. Map Endpoints & Parameters:
   - Identify dynamic fields (`leadId`, `sessionId`, `DATE_FROM`, `APPLIED_PAYMENT`).
   - Extract tariff response structures and payload schemas directly from observed dump.

4. Generate `.http` Suite:
   - Save `.http` file in `tools/http/{product}/`.
   - Separate reusable pre-request and response logic into `tools/http/{product}/scripts/*.js`.

---

## 2. JetBrains HTTP Client Architecture Standards

1. External Script Extraction:
   - Prohibited: Inline multi-line JavaScript blocks `< {% ... %}` or `> {% ... %}` inside `.http` files.
   - Required: Extract logic to external `.js` files: `< ./scripts/resolve-vars.js` or `> ./scripts/assert-response.js`.

2. Mandatory Script Linter Directive:
   - Every script in `tools/http/**/scripts/` must begin with:
     ```javascript
     /* eslint-disable */
     ```
   - Permits IDE global variables: `client`, `response`, `request`.

3. Environment Variable Mapping:
   - Map environment variables at file top to enable seamless IDE profile switching:
     ```http
     @BASE_URL={{HTTP_BASE_URL}}
     @CLIENT={{HTTP_OSAGO_CLIENT}}
     ```

4. Mandatory Response Assertions:
   - Every response handler script must execute `client.test(...)` and `client.assert(...)` for:
     1. Exact HTTP status code (`response.status === 200/201/422/404`).
     2. Business lead state (`lead.state === "draft" | "kyc_pending" | "submitted" | "emitted"`).
     3. Key entity attributes (policy number, Deeplink URL, contract ID).
