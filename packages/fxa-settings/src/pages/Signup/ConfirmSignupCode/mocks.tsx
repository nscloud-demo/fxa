/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { LocationProvider } from '@reach/router';
import ConfirmSignupCode from '.';
import { IntegrationType } from '../../../models';
import {
  MOCK_EMAIL,
  MOCK_KEY_FETCH_TOKEN,
  MOCK_SESSION_TOKEN,
  MOCK_UID,
  MOCK_UNWRAP_BKEY,
} from '../../mocks';
import {
  ConfirmSignupCodeBaseIntegration,
  ConfirmSignupCodeIntegration,
} from './interfaces';

export const MOCK_AUTH_ERROR = {
  errno: 999,
  message: 'Something broke',
};

function createMockWebIntegration(): ConfirmSignupCodeBaseIntegration {
  return {
    type: IntegrationType.Web,
    data: { uid: MOCK_UID },
  };
}

const MOCK_WEB_INTEGRATION = createMockWebIntegration();

export const Subject = ({
  integration = MOCK_WEB_INTEGRATION,
  newsletterSlugs,
}: {
  integration?: ConfirmSignupCodeIntegration;
  newsletterSlugs?: string[];
}) => {
  return (
    <LocationProvider>
      <ConfirmSignupCode
        {...{
          email: MOCK_EMAIL,
          uid: MOCK_UID,
          sessionToken: MOCK_SESSION_TOKEN,
          keyFetchToken: MOCK_KEY_FETCH_TOKEN,
          unwrapBKey: MOCK_UNWRAP_BKEY,
          newsletterSlugs,
          integration,
        }}
        finishOAuthFlowHandler={() => Promise.resolve({ redirect: 'someUri' })}
      />
    </LocationProvider>
  );
};
