# Lifecycle Hooks Technical Specification

Technical specification and contract for Antigravity lifecycle hooks in SmartFeed Studio (`hooks.json`).

## 1. Tool Matcher Identifiers

- Command execution: `run_command`
- File modifications: `write_file`, `edit_file`, `read_file`
- MCP tools: `call_mcp_tool` or native `mcp_.*` prefix
- PreToolUse matcher: `run_command|write_file|edit_file|read_file|call_mcp_tool`

## 2. Decision Logic and Auto-Approval

- Consolidated inside `scripts/pre-tool-guard.mjs`.
- If tool call is MCP (`call_mcp_tool` or `mcp_.*`), guard returns `{"decision": "allow"}` immediately per `CORE-08`.
- For `run_command`, `write_file`, `edit_file`, and `read_file`, rules R1 through R9 are sequentially evaluated.

## 3. SessionStart and Stop Hook Contracts

- SessionStart:
  - Input (stdin): `conversationId`, `workspacePaths`, `transcriptPath`, `artifactDirectoryPath`, `modelName`.
  - Output (stdout): `{"injectSteps": [{"ephemeralMessage": "..."}]}`.
  - Context budget: <=1500 tokens reminding agent of active task, `CORE-14` (reading `plans/completed/*.compressed.md`), and core invariants.

- Stop:
  - Input (stdin): `executionNum`, `terminationReason` (`"NO_TOOL_CALL"`), `fullyIdle: true`.
  - Condition: triggered when `executionNum <= 2` and `terminationReason === "NO_TOOL_CALL"`.
  - Action: fast git diff inspection (`git diff --name-only`). On critical violations (forbidden `as any`, budget >300 lines, unmasked console logs), returns `{"decision": "continue", "reason": "..."}` for autonomous self-remediation.

## 4. PostToolUse Contract (Auto-Formatter)

- Matcher: `write_file|edit_file`
- Input: `toolCall.name`, `toolCall.args.Path`
- Action: auto-format modified file via Prettier (15s timeout, graceful error handling).
