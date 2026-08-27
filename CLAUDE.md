# 🤖 Claude Guidelines — SmartFeed Studio Monorepo

Welcome! This guide outlines the core rules and operating instructions for working in the **SmartFeed Studio** monorepo.

---

## 🚨 MANDATORY FRONTEND RULE: Visual Testing & `ui-ux-pro-max` Standards

> **CRITICAL RULE**: Whenever ANY change to the frontend UI is made (`apps/desktop` or `apps/admin-portal`), the agent **MUST ALWAYS**:
>
> 1. **Visually Test & Inspect the Changes**: Verify directly in the browser or via automated visual/Playwright execution that the interface renders flawlessly across themes (Dark/Light) and screen resolutions.
> 2. **Check 100% Compliance with `ui-ux-pro-max` Skill Guidelines**: Validate design aesthetics, modern typography, micro-interactions, loading states, high-contrast themes, component size limits, and bilingual i18n parity.
> 3. **Definition of Done**: A UI task **CANNOT and MUST NOT be marked as finished or completed** until both visual inspection and the full `ui-ux-pro-max` verification checklist pass completely.

---

## 🏛 Sub-Package Guides

- **Admin Web Portal**: [`apps/admin-portal/CLAUDE.md`](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/CLAUDE.md)
- **Desktop Client**: [`apps/desktop/CLAUDE.md`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/CLAUDE.md)
- **Backend API**: [`services/backend-api/AGENTS.md`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/AGENTS.md)
- **Central Rules**: [`.agents/rules/rules.md`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/rules.md) and [`.agents/rules/code_review_and_skills.md`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/code_review_and_skills.md)
