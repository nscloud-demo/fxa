/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import Glean from '@mozilla/glean/web';
import { testResetGlean } from '@mozilla/glean/testing';
import sinon, { SinonStub } from 'sinon';

import GleanMetrics, { GleanMetricsContext } from './index';
import * as pings from 'fxa-shared/metrics/glean/web/pings';
import * as event from 'fxa-shared/metrics/glean/web/event';
import { userIdSha256 } from 'fxa-shared/metrics/glean/web/account';
import {
  oauthClientId,
  service,
} from 'fxa-shared/metrics/glean/web/relyingParty';
import {
  deviceType,
  entrypoint,
  flowId,
} from 'fxa-shared/metrics/glean/web/session';
import * as utm from 'fxa-shared/metrics/glean/web/utm';

import { Config } from '../config';
import { FlowQueryParams } from '../..';
import { WebIntegration, useAccount } from '../../models';

const sandbox = sinon.createSandbox();
const mockConfig: Config['glean'] = {
  enabled: false,
  applicationId: 'testo',
  uploadEnabled: false,
  appDisplayVersion: '9001',
  channel: 'test',
  serverEndpoint: 'https://metrics.example.io/',
  logPings: false,
  debugViewTag: '',
};
let mockFlowQueryParams: FlowQueryParams = {};
const mockAccount = {
  metricsEnabled: true,
  recoveryKey: true,
  totpActive: true,
  hasSecondaryVerifiedEmail: false,
} as unknown as ReturnType<typeof useAccount>;
let mockUserAgent = '';
const mockIntegration = { data: {} } as unknown as WebIntegration;
const mockMetricsContext: GleanMetricsContext = {
  flowQueryParams: mockFlowQueryParams,
  account: mockAccount,
  userAgent: mockUserAgent,
  integration: mockIntegration,
};

describe('lib/glean', () => {
  let submitPingStub: SinonStub,
    setDeviceTypeStub: SinonStub,
    setEntrypointStub: SinonStub,
    setEventNameStub: SinonStub,
    setEventReasonStub: SinonStub,
    setFlowIdStub: SinonStub,
    setOauthClientIdStub: SinonStub,
    setServiceStub: SinonStub,
    setuserIdSha256Stub: SinonStub,
    setUtmCampaignStub: SinonStub,
    setUtmContentStub: SinonStub,
    setUtmMediumStub: SinonStub,
    setUtmSourceStub: SinonStub,
    setUtmTermStub: SinonStub;

  beforeEach(async () => {
    mockMetricsContext.flowQueryParams = { flowId: '00ff' };
    mockMetricsContext.userAgent = 'ELinks/0.9.3 (textmode; SunOS)';
    mockIntegration.data = {
      clientId: 'abc',
      service: 'wibble',
      entrypoint: 'theweb',
      utmCampaign: 'greatest',
      utmContent: 'show',
      utmMedium: 'TV',
      utmSource: 'mystery',
      utmTerm: 'thunk',
    };

    setDeviceTypeStub = sandbox.stub(deviceType, 'set');
    setEntrypointStub = sandbox.stub(entrypoint, 'set');
    setEventNameStub = sandbox.stub(event.name, 'set');
    setEventReasonStub = sandbox.stub(event.reason, 'set');
    setFlowIdStub = sandbox.stub(flowId, 'set');
    setOauthClientIdStub = sandbox.stub(oauthClientId, 'set');
    setServiceStub = sandbox.stub(service, 'set');
    setuserIdSha256Stub = sandbox.stub(userIdSha256, 'set');
    setUtmCampaignStub = sandbox.stub(utm.campaign, 'set');
    setUtmContentStub = sandbox.stub(utm.content, 'set');
    setUtmMediumStub = sandbox.stub(utm.medium, 'set');
    setUtmSourceStub = sandbox.stub(utm.source, 'set');
    setUtmTermStub = sandbox.stub(utm.term, 'set');
    submitPingStub = sandbox.stub(pings.accountsEvents, 'submit');
    await testResetGlean('glean-test');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('disabled', () => {
    it('does not call Glean.initialize', () => {
      const initStub = sandbox.stub(Glean, 'initialize');
      sandbox.stub(Glean, 'setUploadEnabled');
      const setEnabledSpy = sandbox.spy(GleanMetrics, 'setEnabled');
      GleanMetrics.initialize(mockConfig, mockMetricsContext);
      sinon.assert.notCalled(initStub);
      sinon.assert.calledOnce(setEnabledSpy);
      sinon.assert.calledWith(setEnabledSpy, false);
    });

    it('does not submit a ping on an event', async () => {
      GleanMetrics.registration.view();
      await new Promise((resovle) =>
        setTimeout(() => {
          sinon.assert.notCalled(submitPingStub);
          resovle(undefined);
        }, 80)
      );
    });

    it('does not set the metrics values', async () => {
      GleanMetrics.registration.view();

      await new Promise((resovle) =>
        setTimeout(() => {
          sinon.assert.notCalled(setOauthClientIdStub);
          sinon.assert.notCalled(setServiceStub);

          sinon.assert.notCalled(setDeviceTypeStub);
          sinon.assert.notCalled(setEntrypointStub);
          sinon.assert.notCalled(setFlowIdStub);

          sinon.assert.notCalled(setUtmCampaignStub);
          sinon.assert.notCalled(setUtmContentStub);
          sinon.assert.notCalled(setUtmMediumStub);
          sinon.assert.notCalled(setUtmSourceStub);
          sinon.assert.notCalled(setUtmTermStub);
          resovle(undefined);
        }, 80)
      );
    });
  });

  describe('initialization error', () => {
    it('disables Glean', async () => {
      const config = { ...mockConfig, enabled: true };
      const initStub = sandbox.stub(Glean, 'initialize').throws();
      GleanMetrics.initialize(config, mockMetricsContext);
      sinon.assert.calledOnce(initStub);
      expect(config.enabled).toBe(false);
      GleanMetrics.registration.view();

      await new Promise((resovle) =>
        setTimeout(() => {
          sinon.assert.notCalled(setuserIdSha256Stub);
          resovle(undefined);
        }, 20)
      );
    });
  });

  describe('enabled', () => {
    it('calls Glean.initialize when enabled', () => {
      const initStub = sandbox.stub(Glean, 'initialize');
      const setEnabledSpy = sandbox.spy(GleanMetrics, 'setEnabled');
      const logPingsStub = sandbox.stub(Glean, 'setLogPings');
      const debugViewTagStub = sandbox.stub(Glean, 'setDebugViewTag');
      GleanMetrics.initialize(
        { ...mockConfig, enabled: true },
        mockMetricsContext
      );
      sinon.assert.calledOnce(initStub);
      sinon.assert.calledWith(
        initStub,
        mockConfig.applicationId,
        mockConfig.uploadEnabled,
        {
          appDisplayVersion: mockConfig.appDisplayVersion,
          channel: mockConfig.channel,
          serverEndpoint: mockConfig.serverEndpoint,
        }
      );
      sinon.assert.calledWith(logPingsStub, mockConfig.logPings);
      sinon.assert.notCalled(debugViewTagStub);
      sinon.assert.calledOnce(setEnabledSpy);
      sinon.assert.calledWith(setEnabledSpy, true);
    });

    it('submits a ping on an event', async () => {
      GleanMetrics.registration.view();
      await new Promise((resovle) =>
        setTimeout(() => {
          sinon.assert.calledOnce(submitPingStub);
          resovle(undefined);
        }, 20)
      );
    });

    it('sets empty strings as defaults', async () => {
      mockIntegration.data = {};
      mockMetricsContext.userAgent = '';
      mockMetricsContext.flowQueryParams = {};
      mockMetricsContext.account = undefined;
      GleanMetrics.initialize(
        { ...mockConfig, enabled: true },
        mockMetricsContext
      );
      GleanMetrics.registration.view();

      await new Promise((resovle) =>
        setTimeout(() => {
          sinon.assert.calledWith(setuserIdSha256Stub, '');

          sinon.assert.calledWith(setOauthClientIdStub, '');
          sinon.assert.calledWith(setServiceStub, '');

          sinon.assert.calledWith(setDeviceTypeStub, '');
          sinon.assert.calledWith(setEntrypointStub, '');
          sinon.assert.calledWith(setFlowIdStub, '');

          sinon.assert.calledWith(setUtmCampaignStub, '');
          sinon.assert.calledWith(setUtmContentStub, '');
          sinon.assert.calledWith(setUtmMediumStub, '');
          sinon.assert.calledWith(setUtmSourceStub, '');
          sinon.assert.calledWith(setUtmTermStub, '');
          resovle(undefined);
        }, 20)
      );
    });

    it('sets the metrics values', async () => {
      GleanMetrics.initialize(
        { ...mockConfig, enabled: true },
        mockMetricsContext
      );

      GleanMetrics.registration.view();

      await new Promise((resovle) =>
        setTimeout(() => {
          sinon.assert.calledWith(
            setOauthClientIdStub,
            mockIntegration.data.clientId
          );
          sinon.assert.calledWith(setServiceStub, mockIntegration.data.service);

          sinon.assert.calledWith(setDeviceTypeStub, 'desktop');
          sinon.assert.calledWith(
            setEntrypointStub,
            mockIntegration.data.entrypoint
          );
          sinon.assert.calledWith(setFlowIdStub, '00ff');

          sinon.assert.calledWith(
            setUtmCampaignStub,
            mockIntegration.data.utmCampaign
          );
          sinon.assert.calledWith(
            setUtmContentStub,
            mockIntegration.data.utmContent
          );
          sinon.assert.calledWith(
            setUtmMediumStub,
            mockIntegration.data.utmMedium
          );
          sinon.assert.calledWith(
            setUtmSourceStub,
            mockIntegration.data.utmSource
          );
          sinon.assert.calledWith(setUtmTermStub, mockIntegration.data.utmTerm);
          resovle(undefined);
        }, 20)
      );
    });

    it('submits the pings in order', async () => {
      // not await on these calls
      GleanMetrics.registration.view();
      GleanMetrics.registration.submit();
      GleanMetrics.registration.success();

      // the ping submissions are await'd internally in GleanMetrics...
      await new Promise((resovle) =>
        setTimeout(() => {
          // the set name call is after the await of the ping ahead of it...
          expect(
            setDeviceTypeStub
              .getCall(0)
              .calledBefore(setEventNameStub.getCall(1))
          ).toBeTruthy();

          expect(
            setDeviceTypeStub
              .getCall(1)
              .calledBefore(setEventNameStub.getCall(2))
          ).toBeTruthy();

          resovle(true);
        }, 80)
      );
    });

    describe('hashed uid', () => {
      it('logs hashed uid when session token exists', async () => {
        mockMetricsContext.account = { uid: 'testo' } as ReturnType<
          typeof useAccount
        >;
        GleanMetrics.login.success();
        // the ping submissions are await'd internally in GleanMetrics...
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledTwice(setuserIdSha256Stub);
            // it sets a default of '' first
            sinon.assert.calledWith(setuserIdSha256Stub, '');
            sinon.assert.calledWith(
              setuserIdSha256Stub,
              '7ca0172850c53065046beeac3cdec3fe921532dbfebdf7efeb5c33d019cd7798'
            );
            resovle(undefined);
          }, 20)
        );
      });
    });

    describe('email first', () => {
      it('submits a ping with the email_first_view event name', async () => {
        GleanMetrics.emailFirst.view();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'email_first_view');
            resovle(undefined);
          }, 20)
        );
      });
    });

    describe('registration', () => {
      it('submits a ping with the reg_view event name', async () => {
        GleanMetrics.registration.view();

        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'reg_view');
            resovle(undefined);
          }, 20)
        );
      });

      it('submits a ping with the reg_submit event name', async () => {
        GleanMetrics.registration.submit();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'reg_submit');
            resovle(undefined);
          }, 20)
        );
      });

      it('submits a ping with the reg_submit_success event name', async () => {
        GleanMetrics.registration.success();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'reg_submit_success');
            resovle(undefined);
          }, 20)
        );
      });
    });

    describe('signup confirmation code', () => {
      it('submits a ping with the reg_signup_code_view event name', async () => {
        GleanMetrics.signupConfirmation.view();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'reg_signup_code_view');
            resovle(undefined);
          }, 20)
        );
      });

      it('submits a ping with the reg_signup_code_submit event name', async () => {
        GleanMetrics.signupConfirmation.submit();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'reg_signup_code_submit');
            resovle(undefined);
          }, 20)
        );
      });
    });

    describe('loginConfirmation', () => {
      it('submits a ping with the login_email_confirmation_view event name', async () => {
        GleanMetrics.loginConfirmation.view();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(
              setEventNameStub,
              'login_email_confirmation_view'
            );
            resovle(undefined);
          }, 20)
        );
      });

      it('submits a ping with the reg_submit event name', async () => {
        GleanMetrics.loginConfirmation.submit();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(
              setEventNameStub,
              'login_email_confirmation_submit'
            );
            resovle(undefined);
          }, 20)
        );
      });
    });

    describe('totpForm', () => {
      it('submits a ping with the login_totp_form_view event name', async () => {
        GleanMetrics.totpForm.view();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'login_totp_form_view');
            resovle(undefined);
          }, 20)
        );
      });

      it('submits a ping with the login_totp_code_submit event name', async () => {
        GleanMetrics.totpForm.submit();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'login_totp_code_submit');
            resovle(undefined);
          }, 20)
        );
      });

      it('submits a ping with the login_totp_code_success_view event name', async () => {
        GleanMetrics.totpForm.success();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(
              setEventNameStub,
              'login_totp_code_success_view'
            );
            resovle(undefined);
          }, 20)
        );
      });
    });

    describe('login', () => {
      it('submits a ping with the login_view event name', async () => {
        GleanMetrics.login.view();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'login_view');
            resovle(undefined);
          }, 20)
        );
      });

      it('submits a ping with the login_submit event name', async () => {
        GleanMetrics.login.submit();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'login_submit');
            resovle(undefined);
          }, 20)
        );
      });

      it('submits a ping with the login_submit_success event name', async () => {
        GleanMetrics.login.success();
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(setEventNameStub, 'login_submit_success');
            resovle(undefined);
          }, 20)
        );
      });

      it('submits a ping with the login_submit_frontend_error event name and a reason', async () => {
        GleanMetrics.login.error({ reason: 'quux' });
        await new Promise((resovle) =>
          setTimeout(() => {
            sinon.assert.calledOnce(setEventNameStub);
            sinon.assert.calledWith(
              setEventNameStub,
              'login_submit_frontend_error'
            );
            sinon.assert.calledOnce(setEventReasonStub);
            sinon.assert.calledWith(setEventReasonStub, 'quux');
            resovle(undefined);
          }, 20)
        );
      });
    });
  });

  describe('toggle enabled state', () => {
    let setEnabledStub: SinonStub;

    beforeEach(() => {
      setEnabledStub = sandbox.stub(Glean, 'setUploadEnabled');
    });

    it('set enabled to true', async () => {
      await GleanMetrics.setEnabled(true);
      sinon.assert.calledOnce(setEnabledStub);
      sinon.assert.calledWith(setEnabledStub, true);
    });

    it('set enabled to false', async () => {
      await GleanMetrics.setEnabled(false);
      sinon.assert.calledOnce(setEnabledStub);
      sinon.assert.calledWith(setEnabledStub, false);
    });
  });
});
