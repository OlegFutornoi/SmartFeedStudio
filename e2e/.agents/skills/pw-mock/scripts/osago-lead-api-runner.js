/* eslint-disable */
/**
 * Standalone OSAGO Lead & Profile API Flow Runner and Inspector.
 * Executes and diagnoses the complete lifecycle of an OSAGO lead and customer Profile via REST API:
 * 1. Resolve vehicle data by license plate number
 * 2. Fetch tariffs and select provider (EWA / AIWA)
 * 3. Create lead with vehicle (including ownerBirthYear) and customer Tax ID
 * 4. Submit lead to broker / insurer
 * 5. Verify OTP
 * 6. Inspect lead state, payment link, and generated EWA/AIWA contracts
 * 7. Authenticate via ID-Service and inspect Profile API (vehicles, ownerBirthYear, documents)
 *
 * Usage:
 *   node .agents/skills/pw-mock/scripts/osago-lead-api-runner.js [options]
 *
 * Options:
 *   --env=<review1|review2|stage|prod>   Target environment (default: review2)
 *   --phone=<+380XXXXXXXXX>              Customer phone (default: +380666666666)
 *   --taxId=<10 digits>                  Customer Tax ID / ІПН (default: 3742941484)
 *   --number=<car number>                Vehicle plate (default: AA0326HH)
 *   --birthYear=<year>                   Owner birth year (default: 1991)
 *   --leadId=<uuid>                      Inspect existing lead state and contracts directly
 *   --profile-only                       Only authenticate and inspect customer Profile API
 */

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [k, v] = arg.replace(/^--/, '').split('=');
  acc[k] = v === undefined ? true : v;
  return acc;
}, {});

const ENV_MAP = {
  review1: {
    host: 'https://insurance-bpm-api-review1.treeumapp.net',
    idHost: 'https://id-finance-stage.treeumapp.net',
  },
  review2: {
    host: 'https://insurance-bpm-api-review2.treeumapp.net',
    idHost: 'https://id-finance-stage.treeumapp.net',
  },
  stage: {
    host: 'https://insurance-bpm-api-stage.treeumapp.net',
    idHost: 'https://id-finance-stage.treeumapp.net',
  },
  prod: {
    host: 'https://insurance-bpm-api-prod.treeumapp.net',
    idHost: 'https://id.treeum.net',
  },
};

const targetEnv = args.env || 'review2';
const envConfig = ENV_MAP[targetEnv] || ENV_MAP.review2;
const BASE_URL = `${envConfig.host}/api/v1`;
const ID_HOST = envConfig.idHost;

const PHONE = String(args.phone || '+380666666666').trim();
const TAX_ID = String(args.taxId || '3742941484').trim();
const CAR_NUMBER = String(args.number || 'AA0326HH').trim();
const OWNER_BIRTH_YEAR = Number(args.birthYear || 1991);
const OTP_CODE = String(args.otp || '111111').trim();

async function inspectProfile(phone) {
  console.log(`\n👤 === Inspecting Profile API for phone: ${phone} on ${ID_HOST} ===`);
  const cleanPhone = phone.replace(/^\+/, '');

  // 1. ID Login
  const loginRes = await fetch(`${ID_HOST}/api/id/v1/login_phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone: cleanPhone, project: 'finance' }),
  });
  const loginData = await loginRes.json();
  const sessionId = loginData.session_id || loginData.data?.session_id;
  if (!sessionId) {
    console.log('❌ ID-Service login failed:', JSON.stringify(loginData));
    return;
  }

  // 2. ID OTP
  const otpRes = await fetch(`${ID_HOST}/api/id/v1/login_phone_otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ session_id: sessionId, code: OTP_CODE, project: 'finance' }),
  });
  const otpData = await otpRes.json();
  let token = otpData.token || otpData.data?.token;

  // 3. Refresh token if needed
  if (!token && otpData.refresh_token) {
    const refRes = await fetch(`${ID_HOST}/api/id/v1/refresh_token`, {
      headers: { Cookie: `refresh_token=${otpData.refresh_token}` },
    });
    const refData = await refRes.json();
    token = refData.token || refData.data?.token;
  }

  if (!token) {
    console.log('❌ Failed to obtain JWT profile token:', JSON.stringify(otpData));
    return;
  }
  console.log('🔑 JWT Token obtained successfully');

  // 4. Request Profile Sync
  const profInitRes = await fetch(`${BASE_URL}/insurance/osago/lead/profile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ async: 'no' }),
  });
  const profData = await profInitRes.json();
  const leadInfo = profData.data?.leadInfo || {};
  const customer = leadInfo.customer || {};
  const vehicles = leadInfo.vehicles || [];

  console.log(`\n📋 Profile Data Summary:`);
  console.log(
    `   Customer: ${customer.firstName || ''} ${customer.lastName || ''} (ІПН: ${customer.taxId || '<немає>'})`,
  );
  console.log(
    `   Phone: ${customer.phoneNumber || '<немає>'}, Email: ${customer.email || '<немає>'}`,
  );
  console.log(`   Registered Address: ${customer.registrationAddress || '<немає>'}`);
  console.log(`   Vehicles count: ${vehicles.length}`);

  vehicles.forEach((v, idx) => {
    const birthYear =
      v.ownerBirthYear ?? v.vehicle_owner_birth_year ?? v.vehicleOwnerBirthYear ?? null;
    console.log(
      `\n   🚗 [Vehicle #${idx + 1}] ${v.number || '<без номера>'} | ${v.brand || ''} ${v.model || ''} (${v.year || ''})`,
    );
    console.log(`      VIN: ${v.vinCode || '<none>'}`);
    console.log(
      `      Engine Volume: ${v.engineVolume || '<none>'}, Seating: ${v.seatingCapacity || '<none>'}`,
    );
    console.log(`      Place ID: ${v.placeId || '<none>'}`);
    if (birthYear) {
      console.log(`      ✅ ownerBirthYear: ${birthYear}`);
    } else {
      console.log(
        `      ❌ ownerBirthYear: ВІДСУТНІЙ у профілі (наявні поля: ${Object.keys(v).join(', ')})`,
      );
    }
  });

  console.log(`=======================================================\n`);
}

async function inspectLead(leadId, sessionId = '') {
  console.log(`\n🔍 === Inspecting Lead: ${leadId} ===`);
  const res = await fetch(`${BASE_URL}/insurance/osago/lead/${leadId}`, {
    headers: sessionId ? { 'X-Session-Id': sessionId } : {},
  });
  const data = await res.json();
  const lead = data.data || {};
  const info = lead.leadInfo || {};

  console.log(`   State: ${lead.state}`);
  console.log(`   Payment Link: ${info.payment?.link || '<none>'}`);
  console.log(
    `   Customer: ${info.customer?.firstName} ${info.customer?.lastName} (ІПН: ${info.customer?.taxId})`,
  );
  console.log(
    `   Vehicle: ${info.vehicle?.number} (${info.vehicle?.brand} ${info.vehicle?.model}), ownerBirthYear=${info.vehicle?.ownerBirthYear}`,
  );

  const contracts = info.ewaContracts || info.aiwaContracts || info.contracts || [];
  console.log(`   Contracts count: ${contracts.length}`);
  contracts.forEach((c, idx) => {
    console.log(
      `      [#${idx + 1}] ID: ${c.id}, Code: ${c.code || c.ewaCode || '<none>'}, State: ${c.state || '<none>'}`,
    );
  });
}

async function runOsagoFlow() {
  console.log(`\n🚀 [OSAGO Flow Runner] Environment: ${targetEnv} (${BASE_URL})`);
  console.log(
    `   Phone: ${PHONE}, Tax ID: ${TAX_ID}, Number: ${CAR_NUMBER}, Owner Birth Year: ${OWNER_BIRTH_YEAR}`,
  );

  // Step 1: Vehicle by number
  console.log('\n1. 🔍 Fetching vehicle info by number...');
  const vRes = await fetch(
    `${BASE_URL}/insurance/osago/vehicle/number?client=finance&number=${CAR_NUMBER}&requestId=test-lead-run`,
  );
  const vData = await vRes.json();
  const vehicleReqId = vData.requestId;

  let vehicle = null;
  if (vehicleReqId) {
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const statRes = await fetch(`${BASE_URL}/insurance/status/${vehicleReqId}`);
      const statData = await statRes.json();
      if (statData.status === 'ok') {
        vehicle = statData.data;
        break;
      }
    }
  }
  console.log(
    `   Vehicle resolved: ${vehicle?.brand || 'Kia'} ${vehicle?.model || 'Soul'}, vin: ${vehicle?.vinCode || 'KNAJT813BA7129776'}`,
  );

  // Step 2: Fetch tariffs
  console.log('\n2. 📊 Fetching tariffs...');
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const dateFrom = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const tariffsUrl = `${BASE_URL}/insurance/osago/tariffs?client=finance&async=no&contractPeriod=year&registrationType=permanent&placeId=${vehicle?.placeId || '21'}&privilege=none&engineVolume=${vehicle?.engineVolume || '1582'}&vehicleType=car&number=${CAR_NUMBER}&locale=ru&dateFrom=${dateFrom}&vehicleYear=${vehicle?.year || '2009'}&vehicleVinCode=${vehicle?.vinCode || 'KNAJT813BA7129776'}&customerTaxId=${TAX_ID}&vehicleOwnerBirthYear=${OWNER_BIRTH_YEAR}`;

  const tRes = await fetch(tariffsUrl);
  const tData = await tRes.json();
  const tariffs = tData.tariffs || [];
  const tariffItem = tariffs.find((t) => t?.tariff?.providerName === 'ewa') || tariffs[0];
  const tariff = tariffItem?.tariff;
  if (!tariff) {
    throw new Error(`❌ No tariffs returned: ${JSON.stringify(tData)}`);
  }
  console.log(
    `   Tariff: ID=${tariff.id}, Provider=${tariff.providerName}, DiscountedPayment=${tariff.discountedPayment}`,
  );

  // Step 3: Create lead
  console.log('\n3. 📝 Creating OSAGO Lead...');
  const leadPayload = {
    client: 'finance',
    locale: 'ru',
    promoCode: 'друзі8',
    tariff: {
      id: tariff.id,
      uuid: tariff.uuid,
      providerName: tariff.providerName,
      dateFrom,
      contractPeriod: 'year',
      registrationType: 'permanent',
      fetchedByNumber: true,
    },
    customer: {
      privilege: 'none',
      firstName: 'Олег',
      lastName: 'Футорний',
      middleName: 'Борисович',
      phoneNumber: PHONE,
      email: 'o.futornyi@treeum.net',
      taxId: TAX_ID,
      registrationAddress: 'м. Київ вул. Хрещатик 1',
      document: {
        type: 'passport',
        passportSeries: 'ЛЛ',
        passportNumber: '123456',
        passportDateFrom: '2005-10-11',
        passportIssuedBy: 'ТЕСТ HTTP CLIENT',
      },
    },
    vehicle: {
      type: vehicle?.type || 'car',
      engineVolume: String(vehicle?.engineVolume || 1582),
      grossWeight: String(vehicle?.grossWeight || 1800),
      curbWeight: String(vehicle?.curbWeight || 1440),
      seatingCapacity: String(vehicle?.seatingCapacity || 5),
      mileage: null,
      color: vehicle?.color || 'ЧОРНИЙ',
      placeId: String(vehicle?.placeId || 21),
      isForeign: false,
      number: CAR_NUMBER,
      brandId: String(vehicle?.brandId || 14),
      brand: vehicle?.brand || 'Kia',
      modelId: String(vehicle?.modelId || 1347),
      model: vehicle?.model || 'Soul',
      vinCode: vehicle?.vinCode || 'KNAJT813BA7129776',
      year: String(vehicle?.year || 2009),
      ownerBirthYear: OWNER_BIRTH_YEAR,
    },
    meta: {
      referer: 'https://finance-osago-review2.treeumapp.net/insurance/osago',
      utmSource: 'manual',
      utmCampaign: 'osago_lead_flow',
      utmMedium: 'http-client',
    },
  };

  const cRes = await fetch(`${BASE_URL}/insurance/osago/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(leadPayload),
  });
  const cData = await cRes.json();
  const leadId = cData.data?.leadId;
  const sessionId = cData.data?.sessionId;
  if (!leadId || !sessionId) {
    throw new Error(`❌ Create lead failed: ${JSON.stringify(cData)}`);
  }
  console.log(`   ✅ Lead created: leadId=${leadId}, sessionId=${sessionId}`);

  // Step 4: Submit lead
  console.log('\n4. 🚀 Submitting lead...');
  const sRes = await fetch(`${BASE_URL}/insurance/osago/lead/${leadId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Session-Id': sessionId,
    },
    body: JSON.stringify(leadPayload),
  });
  const sData = await sRes.json();
  const submitReqId = sData.requestId || sData.data?.requestId || leadId;
  console.log(`   Submit request ID: ${submitReqId}`);

  console.log("   Waiting for lead state to become 'otp_pending'...");
  let isOtpPending = false;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statRes = await fetch(`${BASE_URL}/insurance/status/${submitReqId}`);
    const statData = await statRes.json();
    const state = statData.data?.leadState;
    if (state === 'otp_pending') {
      isOtpPending = true;
      console.log(`   ✅ Lead state: otp_pending`);
      break;
    }
  }

  if (!isOtpPending) {
    console.log(
      '   ⚠️ Lead did not enter otp_pending within timeout, proceeding to OTP verification...',
    );
  }

  // Step 5: OTP confirm
  console.log('\n5. 🔑 Confirming OTP code (111111)...');
  const otpRes = await fetch(`${BASE_URL}/insurance/osago/lead/${leadId}/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
    body: JSON.stringify({ client: 'finance', otpCode: OTP_CODE }),
  });
  const otpData = await otpRes.json();
  console.log('   OTP confirmation response:', JSON.stringify(otpData));

  // Step 6: Polling for payment_pending & Inspecting lead
  console.log('\n6. 🔎 Checking lead state after OTP...');
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const leadRes = await fetch(`${BASE_URL}/insurance/osago/lead/${leadId}`, {
      headers: { 'X-Session-Id': sessionId },
    });
    const leadData = await leadRes.json();
    const state = leadData.data?.state;
    const link = leadData.data?.leadInfo?.payment?.link;
    console.log(`   [Poll #${i + 1}] Lead State: ${state}, Payment Link: ${link || '<pending>'}`);
    if (state === 'payment_pending' && link) {
      break;
    }
  }

  await inspectLead(leadId, sessionId);

  // Step 7: Inspect profile
  await inspectProfile(PHONE);
}

async function main() {
  if (args['profile-only']) {
    await inspectProfile(PHONE);
  } else if (args.leadId) {
    await inspectLead(String(args.leadId));
  } else {
    await runOsagoFlow();
  }
}

main().catch((err) => {
  console.error('❌ Execution error:', err);
  process.exit(1);
});
