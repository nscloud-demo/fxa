/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EligibilityContentByPlanIdsQueryFactory } from '../../factories';
import { EligibilityContentByPlanIdsResult } from './types';
import { EligibilityContentByPlanIdsResultUtil } from './util';

describe('EligibilityContentByPlanIdsResultUtil', () => {
  it('should create a util from response', () => {
    const result = EligibilityContentByPlanIdsQueryFactory();
    const planId = result.purchaseCollection?.items[0]?.stripePlanChoices?.[0];
    const util = new EligibilityContentByPlanIdsResultUtil(
      result as EligibilityContentByPlanIdsResult
    );
    expect(util).toBeDefined();
    expect(util.offeringForPlanId(planId ?? '')?.stripeProductId).toBeDefined();
    expect(util.purchaseCollection.items.length).toBe(1);
  });
});
