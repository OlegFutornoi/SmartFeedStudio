/**
 * SmartFeed Studio — Frontend & UI Guardrails.
 * Rules: FE-02, FE-03, FE-05, FE-06, FE-07, FE-08, FE-09, FE-10, FE-11, FE-12, FE-13, FE-14, UI-14, UI-15, I18N-05, I18N-06
 */

export function checkFrontendRules(relPath, content, out) {
  // FE-02: React.StrictMode check
  if (relPath.endsWith('next.config.mjs') && content.includes('reactStrictMode: true')) {
    out.push({ rule: 'FE-02', line: 1, message: 'React.StrictMode must be false in next.config.mjs.' });
  }
  if (relPath.endsWith('apps/desktop/src/main.tsx') && content.includes('<React.StrictMode>')) {
    out.push({ rule: 'FE-02', line: 1, message: 'React.StrictMode wrapping is prohibited in desktop main.tsx.' });
  }

  // FE-03: Zero Redundant Post-Auth /auth/me Calls
  if (relPath.includes('auth') && (relPath.endsWith('.ts') || relPath.endsWith('.tsx'))) {
    if (/(?:login|register)\s*\([^)]*\)[\s\S]{0,100}(?:refreshProfile|fetchMe)\s*\(/.test(content)) {
      out.push({ rule: 'FE-03', line: 1, message: 'Redundant post-auth /auth/me call: login returns profile.' });
    }
  }

  // FE-05: Mandatory Table Row Extraction
  if (relPath.includes('Table') && relPath.endsWith('.tsx') && !relPath.includes('TableRow') && content.split('\n').length > 200) {
    if (content.includes('<TableBody>') && content.includes('<TableRow') && (content.match(/<TableCell/g) || []).length > 8) {
      out.push({ rule: 'FE-05', line: 1, message: 'Mandatory Table Row Extraction: Large tables (>200 lines) must extract *TableRow.tsx.' });
    }
  }

  // FE-06: List Page Modularity & Dialogs Container
  if (relPath.includes('page.tsx') || relPath.endsWith('Page.tsx')) {
    const dialogCount = (content.match(/<(?:Dialog|AlertDialog)\b/g) || []).length;
    if (dialogCount > 2 && !content.includes('DialogsContainer')) {
      out.push({ rule: 'FE-06', line: 1, message: 'List Page Modularity: Extract multiple dialogs into *DialogsContainer.tsx.' });
    }
  }

  // FE-07: Prohibit auth token storage in raw localStorage within React components
  if ((relPath.startsWith('apps/desktop/src/components/') || relPath.startsWith('apps/admin-portal/src/components/')) && relPath.endsWith('.tsx')) {
    if (/localStorage\.setItem\(['"](?:token|authToken|access_token|jwt)['"]/.test(content)) {
      out.push({ rule: 'FE-07', line: 1, message: 'Prohibited direct auth token in localStorage. Use AuthContext.' });
    }
  }

  // FE-08: Mock <-> Real Data Parity
  if (relPath.endsWith('mockDatabaseDriver.ts')) {
    if (content.includes("supplierName: 'Постачальник'") || content.includes("supplierName: 'Supplier'")) {
      out.push({ rule: 'FE-08', line: 1, message: 'Mock Real Parity: Column header strings leaked as data in mockDatabaseDriver.' });
    }
  }

  // FE-09: Client-Level In-Flight Request Deduplication
  if (relPath.endsWith('BaseApiClient.ts') || relPath.endsWith('fetchWithAuth.ts')) {
    if (!content.includes('inFlightRequests') && !content.includes('inFlight')) {
      out.push({ rule: 'FE-09', line: 1, message: 'Client-Level In-Flight Request Deduplication required in API client.' });
    }
  }

  // FE-10: Zero Duplicate Context Data Re-Fetching
  if (relPath.startsWith('apps/desktop/src/pages/') || relPath.startsWith('apps/admin-portal/src/app/')) {
    if (content.includes('useLicense(') && (content.includes('getMyLicense(') || content.includes('apiClient.getLicense('))) {
      out.push({ rule: 'FE-10', line: 1, message: 'Zero Duplicate Context Data Re-Fetching: Direct call when useLicense() present.' });
    }
  }

  // FE-11: Aggregated Startup Bootstrap
  if (relPath.endsWith('main.tsx') || relPath.endsWith('RootLayout.tsx')) {
    if (content.includes('fetchUserProfile()') && content.includes('fetchUserQuotas()') && content.includes('fetchUserLicense()')) {
      out.push({ rule: 'FE-11', line: 1, message: 'Aggregated Startup Bootstrap: Do not fire isolated startup calls.' });
    }
  }

  // FE-12: Zero Raw Fetch in API client services
  if ((relPath.startsWith('apps/desktop/src/services/api/') || relPath.startsWith('apps/admin-portal/src/services/api/')) && relPath.endsWith('.ts')) {
    if (/\bfetch\s*\(/.test(content)) {
      out.push({ rule: 'FE-12', line: 1, message: 'API client services must use apiClient instead of raw fetch() calls.' });
    }
  }

  // FE-13: Scoped Domain DataSync Subscriptions
  if (relPath.endsWith('.tsx') || relPath.endsWith('.ts')) {
    if (/useDataSync\(\s*\[\s*['"]all['"]\s*\]\s*\)/.test(content) && !relPath.includes('Reconciler')) {
      out.push({ rule: 'FE-13', line: 1, message: 'Scoped Domain DataSync Subscriptions: Subscribing to ["all"] is prohibited.' });
    }
  }

  // FE-14: In-Memory TTL & Navigation Cache for Reference Data
  if (relPath.includes('reference-data') && relPath.endsWith('.service.ts')) {
    if (!content.includes('ttl') && !content.includes('cache')) {
      out.push({ rule: 'FE-14', line: 1, message: 'In-Memory TTL & Navigation Cache required for reference data service.' });
    }
  }

  // UI-14: Restrained Multi-Select & Matrix States
  if ((relPath.includes('matrix') || relPath.includes('category-selector')) && relPath.endsWith('.tsx')) {
    if (content.includes('selected') && /\bbg-primary\b/.test(content)) {
      out.push({ rule: 'UI-14', line: 1, message: 'Restrained Multi-Select: Selected items must use neutral elevation, not bg-primary.' });
    }
  }

  // UI-15: Viewport Budget, 2-Column Control Pairing
  if (relPath.includes('Wizard') && relPath.endsWith('.tsx')) {
    if (content.includes('min-h-[1400px]') || content.includes('h-[1600px]')) {
      out.push({ rule: 'UI-15', line: 1, message: 'Viewport Budget: Multi-step wizard exceeds standard viewport budget.' });
    }
  }

  // I18N-05: Prohibit raw English backend enum status in JSX
  if ((relPath.startsWith('apps/desktop/src/') || relPath.startsWith('apps/admin-portal/src/')) && relPath.endsWith('.tsx')) {
    if (/>\s*(?:APPROVED|DECLINED|PENDING)\s*</.test(content) || /<Badge[^>]*>\s*(?:APPROVED|DECLINED|PENDING)\s*<\/Badge>/.test(content)) {
      out.push({ rule: 'I18N-05', line: 1, message: 'Zero English enums in UI: Translate backend status enums into localized strings.' });
    }
    // I18N-06: Clean Numeric Metric Formatting (unrounded percentages)
    if (/\{[^}]*\/\s*[^}]*\*\s*100\s*\}%/.test(content)) {
      out.push({ rule: 'I18N-06', line: 1, message: 'Raw floating-point calculation in UI. Use Math.round() or .toFixed(1).' });
    }
  }
}
