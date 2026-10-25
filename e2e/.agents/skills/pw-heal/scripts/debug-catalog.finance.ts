/* eslint-disable */
import { test, expect } from '@playwright/test';
import { e2eTest } from '../../../../../fixtures';
import { osagoPromocodes } from '../../../osago/pages/support/promocodes.data';
import {
  ensureCatalogOffersLoaded,
  openCatalogFromRedesignParams,
} from '../../../osago/redesign/support/helpers/osago-redesign.helpers';
import { buildOsagoRedesignByParamsLandingData } from '../../../osago/redesign/support/data/builders/osago-redesign-data.builders';
import { PromocodeFlow } from '../helpers/promocode.flow';

e2eTest('Debug catalog header', async ({ page }) => {
  const landingData = { ...buildOsagoRedesignByParamsLandingData(), registrationPlace: 'Київ' };
  await openCatalogFromRedesignParams(page, { landingData });
  await ensureCatalogOffersLoaded(page);
  await PromocodeFlow.applyInCatalog(page, osagoPromocodes.valid);

  // Give it a second to reload
  await page.waitForTimeout(2000);

  const html = await page.innerHTML('body');
  const fs = require('fs');
  fs.writeFileSync('/tmp/catalog_body.html', html);
});
