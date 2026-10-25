/* eslint-disable */
/**
 * Standalone Travel Lead API Flow Runner
 * Executes the entire lifecycle of a Travel Insurance lead directly via REST API:
 * 1. Fetch Tariffs
 * 2. Create Draft Contract
 * 3. State Transition: DRAFT -> REQUEST
 * 4. Send OTP
 * 5. Verify OTP
 * 6. State Transition: REQUEST -> EMITTED
 *
 * Usage:
 *   node .agents/skills/pw-mock/scripts/travel-lead-api-runner.js [BASE_URL]
 * Default Base URL:
 *   https://product-manager-integration.finance.ua
 */

const BASE_URL =
  process.argv[2] ||
  process.env.BASE_URL_PRODUCT_MANAGER ||
  'https://product-manager-integration.finance.ua';
const project = 4;
const country = 272; // Ukraine
const coverageDays = 8;

async function runTravelApiFlow() {
  console.log(`[Travel API Runner] Target URL: ${BASE_URL}`);

  // 1. Get tariffs
  console.log('=== 1. Fetching Tariffs ===');
  const tariffRes = await fetch(
    `${BASE_URL}/api/v1/insurance/travel/tariff-list?isActive=true&locale=ua&project=${project}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project,
        coverageDays,
        multivisa: false,
        coverageFrom: '2026-08-25',
        coverageTo: '2026-08-30',
        country,
        risks: [{ risk: 1, inCurrency: true }],
        tripPurpose: 'tourism',
        customerCategory: 'NATURAL',
        simplified: true,
        locationInsured: 'UKRAINE',
        birthDays: ['1990-01-01'],
      }),
    },
  );

  if (!tariffRes.ok) {
    throw new Error(`Failed to fetch tariffs: ${tariffRes.status} ${await tariffRes.text()}`);
  }

  const tariffs = await tariffRes.json();
  if (!tariffs || tariffs.length === 0) {
    console.log('⚠️ No tariffs returned by API');
    return;
  }

  const tariffId = tariffs[0].id;
  console.log(`✅ Selected Tariff ID: ${tariffId} (${tariffs[0].company?.title || 'Company'})`);

  // 2. Create Draft
  console.log('\n=== 2. Creating Draft Contract ===');
  const crmKey = `flow-${Date.now()}`;
  const draftRes = await fetch(`${BASE_URL}/api/v1/insurance/travel/contract/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project,
      date: '2026-08-21',
      type: 'tourism',
      state: 'DRAFT',
      tariff: { type: 'tourism', id: tariffId },
      dateFrom: '2026-08-25T00:00:00.000Z',
      coverageDays,
      multivisa: false,
      country: { id: country },
      customer: {
        code: '2853717994',
        nameLast: 'Testenko',
        nameFirst: 'Test',
        phone: '+380661112233',
        email: 'qa-test@treeum.net',
        birthDate: '1990-01-01',
        document: { type: 'EXTERNAL_PASSPORT', series: 'АЕ', number: '123456' },
      },
      risks: [
        {
          risk: { id: 1, shortName: 'МВ', name: 'Медичнi витрати' },
          insuranceAmount: 30000,
          currency: 'EUR',
        },
      ],
      customFields: [
        { code: 'program_of_trip', value: 'standart' },
        { code: 'purpose_of_trip', value: 'tourism' },
      ],
      insuranceObject: {
        type: 'person',
        code: '2853717994',
        nameLast: 'Testenko',
        nameFirst: 'Test',
        birthDate: '1990-01-01',
        document: { type: 'EXTERNAL_PASSPORT', series: 'АЕ', number: '123456' },
      },
      mailData: { hasDgo: false, crmKey, companyTitle: null },
      notes: 'automated-api-runner',
    }),
  });

  const draft = await draftRes.json();
  const contractId = draft.id;
  console.log(`✅ Draft Created. Contract ID: ${contractId}`);

  // 3. Submit DRAFT -> REQUEST
  console.log('\n=== 3. Transition DRAFT -> REQUEST ===');
  const submitRes = await fetch(
    `${BASE_URL}/api/v1/insurance/contract/${contractId}/state/request`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    },
  );
  console.log(`✅ Request State Status: ${submitRes.status}`);

  // 4. Send OTP
  console.log('\n=== 4. Sending OTP ===');
  const otpSendRes = await fetch(`${BASE_URL}/api/v1/insurance/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, contractId }),
  });
  const otpSend = await otpSendRes.json();
  const sessionId = otpSend.sessionId;
  console.log(`✅ OTP Sent. Session ID: ${sessionId}`);

  // 5. Verify OTP (Test code "111111" on stage)
  console.log('\n=== 5. Verifying OTP ===');
  const otpVerifyRes = await fetch(`${BASE_URL}/api/v1/insurance/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, contractId, code: '111111', sessionId }),
  });
  console.log(`✅ OTP Verified Status: ${otpVerifyRes.status}`);

  // 6. EMITTED
  console.log('\n=== 6. Transition to EMITTED ===');
  const emitRes = await fetch(`${BASE_URL}/api/v1/insurance/contract/${contractId}/state/emitted`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project }),
  });
  console.log(`✅ Contract Emitted Status: ${emitRes.status}`);
  console.log('🎉 Travel Lead API Flow completed successfully!');
}

runTravelApiFlow().catch((err) => {
  console.error('❌ Travel API Flow failed:', err);
});
